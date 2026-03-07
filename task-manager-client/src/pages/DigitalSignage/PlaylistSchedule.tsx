import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { Save, ArrowLeft, Clock, Calendar } from 'lucide-react';

const PlaylistSchedule: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    start_time: '08:00',
    end_time: '17:00',
    days_of_week: '1,2,3,4,5' // Mon-Fri
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!playlistId) return;
      const data = await digitalSignageApi.getSchedules(playlistId);
      if (data.length > 0) {
        setFormData({
          start_time: data[0].start_time,
          end_time: data[0].end_time,
          days_of_week: data[0].days_of_week
        });
      }
    };
    fetchSchedules();
  }, [playlistId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistId) return;
    setLoading(true);
    try {
      await digitalSignageApi.createSchedule({ ...formData, playlist_id: playlistId });
      navigate('/admin/digital-signage/playlists');
    } catch (error) {
      console.error('Failed to save schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    const days = formData.days_of_week.split(',').filter(Boolean).map(Number);
    const newDays = days.includes(day) 
      ? days.filter(d => d !== day) 
      : [...days, day].sort();
    setFormData({ ...formData, days_of_week: newDays.join(',') });
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/digital-signage/playlists" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Configure Schedule</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                Start Time
              </label>
              <input
                type="time"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock size={16} className="text-red-500" />
                End Time
              </label>
              <input
                type="time"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Calendar size={16} className="text-emerald-500" />
              Active Days
            </label>
            <div className="grid grid-cols-7 gap-3">
              {dayLabels.map((label, idx) => {
                const isActive = formData.days_of_week.split(',').includes(String(idx));
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`p-3 rounded-xl border-2 transition-all font-bold text-xs ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlaylistSchedule;

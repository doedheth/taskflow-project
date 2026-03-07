import React, { useState, useEffect } from 'react';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { useNavigate } from 'react-router-dom';
import { Template } from '../../types/digitalSignage';
import { Save, ArrowLeft, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlaylistForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    priority: 0
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      const data = await digitalSignageApi.getTemplates();
      setTemplates(data);
    };
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await digitalSignageApi.createPlaylist(formData);
      navigate('/admin/digital-signage/playlists');
    } catch (error) {
      console.error('Failed to create playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/digital-signage/playlists" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Create New Playlist</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Playlist Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Summer Promotion"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Select Template</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                required
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.layout_type})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Priority (High plays first)</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              />
              <p className="text-[10px] text-gray-400 italic">* Jika playlist tidak memiliki jadwal, maka akan otomatis tampil (Always On).</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlaylistForm;

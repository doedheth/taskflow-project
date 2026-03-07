import React, { useEffect, useState } from 'react';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { Playlist } from '../../types/digitalSignage';
import { Plus, Trash2, List, Calendar, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlaylistList: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = async () => {
    try {
      const data = await digitalSignageApi.getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await digitalSignageApi.deletePlaylist(id);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Playlist Management</h1>
        <Link to="/admin/digital-signage/playlists/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Create Playlist
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-violet-50 rounded-lg text-violet-600">
                <List size={24} />
              </div>
              <button onClick={() => handleDelete(playlist.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                <Trash2 size={20} />
              </button>
            </div>
            
            <h3 className="font-bold text-xl mb-1">{playlist.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Settings size={14} />
              Template: <span className="text-gray-600 font-medium">{playlist.template_name}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`/admin/digital-signage/playlists/${playlist.id}/slides`}
                className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <List size={16} />
                Slides
              </Link>
              <Link
                to={`/admin/digital-signage/playlists/${playlist.id}/schedule`}
                className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                <Calendar size={16} />
                Schedule
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistList;

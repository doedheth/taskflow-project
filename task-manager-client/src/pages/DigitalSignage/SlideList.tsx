import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { Slide } from '../../types/digitalSignage';
import { Plus, Trash2, ArrowLeft, Video, Image as ImageIcon, FileText, Clock, Edit } from 'lucide-react';

const SlideList: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlides = async () => {
    if (!playlistId) return;
    try {
      const data = await digitalSignageApi.getSlides(playlistId);
      setSlides(data);
    } catch (error) {
      console.error('Failed to fetch slides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [playlistId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await digitalSignageApi.deleteSlide(id);
      fetchSlides();
    } catch (error) {
      console.error('Failed to delete slide:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={20} />;
      case 'image': return <ImageIcon size={20} />;
      default: return <FileText size={20} />;
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/digital-signage/playlists" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Manage Slides</h1>
        </div>
        <Link 
          to={`/admin/digital-signage/playlists/${playlistId}/slides/new`} 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Slide
        </Link>
      </div>

      <div className="space-y-4">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                {getIcon(slide.type)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{slide.title}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1 uppercase tracking-wider font-bold">
                    {slide.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {slide.duration}s
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                to={`/admin/digital-signage/playlists/${playlistId}/slides/${slide.id}/edit`}
                className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"
              >
                <Edit size={20} />
              </Link>
              <button onClick={() => handleDelete(slide.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No slides added yet. Click "Add Slide" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideList;

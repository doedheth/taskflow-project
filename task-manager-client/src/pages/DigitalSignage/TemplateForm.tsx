import React, { useState } from 'react';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { useNavigate } from 'react-router-dom';
import { Layout, Monitor, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TemplateForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    layout_type: 'single' as const,
    layout_config: {},
    orientation: {
      orientation_type: 'landscape' as const,
      width: 1920,
      height: 1080
    }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await digitalSignageApi.createTemplate(formData);
      navigate('/admin/digital-signage/templates');
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/digital-signage/templates" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Create New Template</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Template Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Lobby Screen"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Layout Type</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.layout_type}
                onChange={(e) => setFormData({ ...formData, layout_type: e.target.value as any })}
              >
                <option value="single">Single View (Full Screen)</option>
                <option value="split">Split View (Horizontal/Vertical)</option>
                <option value="grid">Grid View (4 Slides)</option>
                <option value="custom">Custom Layout</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="What is this template used for?"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Orientation</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.orientation.orientation_type}
                onChange={(e) => setFormData({ ...formData, orientation: { ...formData.orientation, orientation_type: e.target.value as any } })}
              >
                <option value="landscape">Landscape (Horizontal)</option>
                <option value="portrait">Portrait (Vertical)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Width (px)</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.orientation.width}
                onChange={(e) => setFormData({ ...formData, orientation: { ...formData.orientation, width: Number(e.target.value) } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Height (px)</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.orientation.height}
                onChange={(e) => setFormData({ ...formData, orientation: { ...formData.orientation, height: Number(e.target.value) } })}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;

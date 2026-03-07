import React, { useEffect, useState } from 'react';
import { digitalSignageApi } from '../../services/digitalSignageApi';
import { Template } from '../../types/digitalSignage';
import { Plus, Trash2, Layout, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';

const TemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const data = await digitalSignageApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await digitalSignageApi.deleteTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Template Management</h1>
        <Link to="/admin/digital-signage/templates/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Create Template
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Layout size={24} />
              </div>
              <button onClick={() => handleDelete(template.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                <Trash2 size={20} />
              </button>
            </div>
            <h3 className="font-bold text-lg mb-1">{template.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{template.description || 'No description'}</p>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1">
                <Layout size={14} />
                {template.layout_type}
              </span>
              <span className="flex items-center gap-1">
                <Monitor size={14} />
                {template.orientation?.orientation_type || 'auto'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateList;

import { Request, Response } from 'express';
import db from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export class DigitalSignageController {
  // --- Templates ---
  static async getTemplates(req: Request, res: Response) {
    try {
      const templates = db.prepare('SELECT * FROM templates WHERE is_active = 1').all();
      const orientationSettings = db.prepare('SELECT * FROM orientation_settings').all();
      
      const combined = templates.map((t: any) => ({
        ...t,
        orientation: orientationSettings.find((o: any) => o.template_id === t.id)
      }));

      res.json(combined);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  }

  static async createTemplate(req: Request, res: Response) {
    try {
      const { name, description, layout_type, layout_config, orientation } = req.body;
      const id = uuidv4();
      
      db.prepare('INSERT INTO templates (id, name, description, layout_type, layout_config) VALUES (?, ?, ?, ?, ?)')
        .run(id, name, description, layout_type, JSON.stringify(layout_config));

      if (orientation) {
        db.prepare('INSERT INTO orientation_settings (id, template_id, orientation_type, width, height) VALUES (?, ?, ?, ?, ?)')
          .run(uuidv4(), id, orientation.orientation_type, orientation.width, orientation.height);
      }

      res.status(201).json({ id, message: 'Template created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  static async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM templates WHERE id = ?').run(id);
      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete template' });
    }
  }

  static async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, layout_type, layout_config, orientation } = req.body;
      
      db.prepare('UPDATE templates SET name = ?, description = ?, layout_type = ?, layout_config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(name, description, layout_type, JSON.stringify(layout_config), id);

      if (orientation) {
        db.prepare('UPDATE orientation_settings SET orientation_type = ?, width = ?, height = ?, updated_at = CURRENT_TIMESTAMP WHERE template_id = ?')
          .run(orientation.orientation_type, orientation.width, orientation.height, id);
      }

      res.json({ message: 'Template updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update template' });
    }
  }

  // --- Playlists ---
  static async getPlaylists(req: Request, res: Response) {
    try {
      const playlists = db.prepare(`
        SELECT p.*, t.name as template_name 
        FROM slideshow_playlists p
        JOIN templates t ON p.template_id = t.id
      `).all();
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch playlists' });
    }
  }

  static async createPlaylist(req: Request, res: Response) {
    try {
      const { name, template_id, priority } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO slideshow_playlists (id, name, template_id, priority) VALUES (?, ?, ?, ?)')
        .run(id, name, template_id, priority || 0);
      res.status(201).json({ id, message: 'Playlist created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  }

  static async deletePlaylist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM slideshow_playlists WHERE id = ?').run(id);
      res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete playlist' });
    }
  }

  static async updatePlaylist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, template_id, priority, is_active } = req.body;
      db.prepare('UPDATE slideshow_playlists SET name = ?, template_id = ?, priority = ?, is_active = ? WHERE id = ?')
        .run(name, template_id, priority, is_active ? 1 : 0, id);
      res.json({ message: 'Playlist updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update playlist' });
    }
  }

  // --- Slides ---
  static async getSlides(req: Request, res: Response) {
    try {
      const { playlistId } = req.params;
      const slides = db.prepare('SELECT * FROM slides WHERE playlist_id = ? ORDER BY order_index ASC').all(playlistId) as any[];
      
      const formattedSlides = slides.map(s => ({
        ...s,
        metadata: JSON.parse(s.metadata || '{}')
      }));
      
      res.json(formattedSlides);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch slides' });
    }
  }

  static async getSlide(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const slide = db.prepare('SELECT * FROM slides WHERE id = ?').get(id) as any;
      
      if (!slide) {
        return res.status(404).json({ error: 'Slide not found' });
      }

      res.json({
        ...slide,
        metadata: JSON.parse(slide.metadata || '{}')
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch slide' });
    }
  }

  static async createSlide(req: Request, res: Response) {
    try {
      const { playlist_id, title, type, content, duration, order_index, metadata } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO slides (id, playlist_id, title, type, content, duration, order_index, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, playlist_id, title, type, content, duration, order_index || 0, JSON.stringify(metadata || {}));
      res.status(201).json({ id, message: 'Slide created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create slide' });
    }
  }

  static async updateSlide(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, type, content, duration, order_index, metadata } = req.body;
      db.prepare('UPDATE slides SET title = ?, type = ?, content = ?, duration = ?, order_index = ?, metadata = ? WHERE id = ?')
        .run(title, type, content, duration, order_index, JSON.stringify(metadata || {}), id);
      res.json({ message: 'Slide updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update slide' });
    }
  }

  static async deleteSlide(req: Request, res: Response) {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM slides WHERE id = ?').run(id);
      res.json({ message: 'Slide deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete slide' });
    }
  }

  // --- Schedules ---
  static async getSchedules(req: Request, res: Response) {
    try {
      const { playlistId } = req.params;
      const schedules = db.prepare('SELECT * FROM schedules WHERE playlist_id = ?').all(playlistId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  }

  static async createSchedule(req: Request, res: Response) {
    try {
      const { playlist_id, start_time, end_time, days_of_week } = req.body;
      const id = uuidv4();
      db.prepare('INSERT INTO schedules (id, playlist_id, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?, ?)')
        .run(id, playlist_id, start_time, end_time, days_of_week);
      res.status(201).json({ id, message: 'Schedule created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  }

  // --- Public Active Content ---
  static async getActiveContent(req: Request, res: Response) {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0-6 (Sun-Sat)

      // Find active playlists (LEFT JOIN schedules to include "Always On" playlists)
      const activePlaylists = db.prepare(`
        SELECT p.*, s.start_time, s.end_time, s.days_of_week, s.id as schedule_id,
               t.layout_type, t.layout_config, os.orientation_type, os.width, os.height
        FROM slideshow_playlists p
        LEFT JOIN schedules s ON p.id = s.playlist_id
        JOIN templates t ON p.template_id = t.id
        LEFT JOIN orientation_settings os ON t.id = os.template_id
        WHERE p.is_active = 1
      `).all() as any[];

      // Sort by priority (higher priority first)
      activePlaylists.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      const matchedPlaylist = activePlaylists.find(p => {
        // If no schedule exists, treat as "Always On"
        if (!p.schedule_id) return true;

        // If schedule exists, check if it's currently active
        const days = (p.days_of_week || '').split(',').filter(Boolean).map(Number);
        if (days.length > 0 && !days.includes(currentDay)) return false;
        if (p.start_time && currentTime < p.start_time) return false;
        if (p.end_time && currentTime > p.end_time) return false;
        
        return true;
      });

      if (!matchedPlaylist) {
        return res.json({ slides: [], config: null });
      }

      const slides = db.prepare('SELECT * FROM slides WHERE playlist_id = ? ORDER BY order_index ASC').all(matchedPlaylist.id) as any[];

      const formattedSlides = slides.map(s => ({
        ...s,
        metadata: JSON.parse(s.metadata || '{}')
      }));

      res.json({
        slides: formattedSlides,
        config: {
          id: matchedPlaylist.id,
          name: matchedPlaylist.name,
          template: {
            layout_type: matchedPlaylist.layout_type,
            layout_config: JSON.parse(matchedPlaylist.layout_config || '{}'),
            orientation: {
              type: matchedPlaylist.orientation_type,
              width: matchedPlaylist.width,
              height: matchedPlaylist.height
            }
          }
        }
      });
    } catch (error) {
      console.error('Error fetching active content:', error);
      res.status(500).json({ error: 'Failed to fetch active content' });
    }
  }
}

## 1. Database Schema
### Tables:
- `templates`: Menyimpan layout dan orientasi.
- `orientation_settings`: Detail dimensi untuk portrait/landscape.
- `slideshow_playlists`: Grup slide yang dijadwalkan.
- `slides`: Konten individual (image, video, text).
- `schedules`: Waktu tayang playlist.

## 2. API Endpoints
- `GET /api/v2/digital-signage/templates`: List templates.
- `POST /api/v2/digital-signage/templates`: Create template.
- `GET /api/v2/digital-signage/playlists`: List playlists.
- `GET /api/v2/digital-signage/active`: Active slideshow for public display.

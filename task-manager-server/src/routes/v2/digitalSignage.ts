import express from 'express';
import { DigitalSignageController } from '../../controllers/DigitalSignageController';

const router = express.Router();

// --- Templates ---
router.get('/templates', DigitalSignageController.getTemplates);
router.post('/templates', DigitalSignageController.createTemplate);
router.put('/templates/:id', DigitalSignageController.updateTemplate);
router.delete('/templates/:id', DigitalSignageController.deleteTemplate);

// --- Playlists ---
router.get('/playlists', DigitalSignageController.getPlaylists);
router.post('/playlists', DigitalSignageController.createPlaylist);
router.put('/playlists/:id', DigitalSignageController.updatePlaylist);
router.delete('/playlists/:id', DigitalSignageController.deletePlaylist);

// --- Slides ---
router.get('/slides/detail/:id', DigitalSignageController.getSlide);
router.get('/slides/:playlistId', DigitalSignageController.getSlides);
router.post('/slides', DigitalSignageController.createSlide);
router.put('/slides/:id', DigitalSignageController.updateSlide);
router.delete('/slides/:id', DigitalSignageController.deleteSlide);

// --- Schedules ---
router.get('/schedules/:playlistId', DigitalSignageController.getSchedules);
router.post('/schedules', DigitalSignageController.createSchedule);

// --- Public Active Content ---
router.get('/active', DigitalSignageController.getActiveContent);

export default router;

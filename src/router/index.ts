import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import VideoRecorder from '../components/VideoRecorder.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'VideoRecorder',
    component: VideoRecorder,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;

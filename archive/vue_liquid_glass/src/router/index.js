import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      name: 'home',
      component: { template: '<div />' }
    },
    {
      path: '/photography',
      name: 'photography',
      alias: ['/photography/', '/Photography', '/Photography/'],
      component: { template: '<div />' }
    },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0 };
  }
});

export default router;

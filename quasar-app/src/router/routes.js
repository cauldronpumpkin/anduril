
const routes = [
  {
    path: '/',
    component: () => import('layouts/LoginLayout.vue')
  },
  {
    path: '/chat',
    component: () => import('layouts/ChatLayout.vue')
  },
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes

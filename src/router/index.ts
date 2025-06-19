import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../components/GameDashboard.vue"),
  },
  {
    path: "/game/:seed",
    name: "Game",
    component: () => import("../components/MemoryBoard.vue"),
    props: true,
  },
  {
    path: "/history",
    name: "History",
    component: () => import("../components/GameHistory.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

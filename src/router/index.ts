import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/GameDashboard.vue"),
  },
  {
    path: "/game/:seed",
    name: "Game",
    component: () => import("../views/MemoryBoard.vue"),
    props: true,
  },
  {
    path: "/history",
    name: "History",
    component: () => import("../views/GameHistory.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

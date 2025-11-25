import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import axios from 'axios'
import VueCookies from 'vue-cookies'


createApp(App).use(VueCookies).use(store).use(router).mount('#app')

// main.js or store.js
const token = VueCookies.get('token');
const userId = VueCookies.get('userId');
if (token && userId) {
  store.commit('setToken', token);
  store.commit('setUserId', userId);
  store.commit('setLoggedIn', true);
}


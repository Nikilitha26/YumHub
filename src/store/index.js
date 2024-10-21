import { createStore } from 'vuex'
import axios from 'axios'
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import {useCookies} from 'vue-cookies'
import router from '@/router';
/* eslint-disable */

axios.defaults.withCredentials = true
axios.defaults.headers = $cookies.get('token')

export default createStore({
  state: {
    posts: null,
    post: null,
    token: null,
    userId: null,
    user: [],
    users: [],
    isLoggedIn: false
  },
  getters: {
    getPosts: (state) => state.posts,
    getPostById: (state) => (id) => state.posts.find((post) => post.postId === id),
  },
  mutations: {
    setPosts(state, payload) {
      state.posts = payload
    },
    setPost(state, payload) {
      state.post = payload
    },
    setLikeCount(state, { postId, likeCount }) {
      let post = state.posts.find(post => post.postId === postId);
      if (post) {
        post.likeCount = likeCount;
      }
    },
    setLoggedIn(state,isLoggedIn){
      state.isLoggedIn = isLoggedIn
    },
    setToken(state, token) {
      state.token = token;
    },
    setRefreshToken(state, refreshToken){
      state.refreshToken = refreshToken;
    },
    setUserId(state, userId) {
      console.log('Setting userId:', userId);
      state.userId = userId;
    },

    setUser(state, user) { 
      state.user = user;
    },

    setUsers(state, users) {
      state.users = users;
    },

    updateUser(state, updatedUser) {
      state.user[0] = updatedUser;
    },

    updateUserInArray(state, user) {
      const index = state.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        state.users.splice(index, 1, user);
        }
    },
  },
  actions: {
    async getPosts({ commit }) {
      let { data } = await axios.get('http://localhost:2000/posts')
      commit('setPosts', data)
    },
    async getPost({ commit }, postId) {
      console.log('Getting post with ID:', postId);
      if (!postId) {
        console.error('Error: postId is undefined');
        return;
      }
      try {
        const response = await axios.get(`http://localhost:2000/posts/${postId}`);
        console.log('API response:', response.data);
        const post = response.data;
        commit('setPost', post);
        return post;
      } catch (error) {
        console.error('Error loading post:', error);
        if (error.response) {
          toast(`Error loading post: ${error.response.data.message}`, {
            "theme": "auto",
            "type": "error",
            "position": "top-center",
            "dangerouslyHTMLString": true
          });
        } else {
          toast("Error loading post. Please try again.", {
            "theme": "auto",
            "type": "error",
            "position": "top-center",
            "dangerouslyHTMLString": true
          });
        }
      }
    },
    async likePost({ commit }, { postId, userId }) {
      try {
        const response = await axios.post('http://localhost:2000/posts/like', { postId, userId });
        const { likeCount } = response.data;
        commit('setLikeCount', { postId, likeCount });
        return likeCount;
      } catch (error) {
        console.error('Error liking post:', error);
        toast("Error liking post. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true
        });
      }
    },
    async updateUser({ commit, state: { token } }, { updatedUser }) {
      const userId = this.$route.params.id;
      if (!userId) {
        console.error('Error: userId is undefined');
        return;
      }
      try {
        const response = await axios.patch(`https://capstoneproject-1-9k8p.onrender.com/users/${userId}`, updatedUser, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.status === 200) {
          commit('updateUser', updatedUser);
          location.reload();
          toast("User updated successfully!", {
            "theme": "auto",
            "type": "default",
            "position": "top-center",
            "dangerouslyHTMLString": true
          });
        } else {
          console.error('Error updating user:', response.data);
          toast("Error updating user. Please try again.", {
            "theme": "auto",
            "type": "error",
            "position": "top-center",
            "dangerouslyHTMLString": true
          });
        }
      } catch (error) {
        console.error('Error updating user:', error);
        toast("Error updating user. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true
        });
      }
    },
      
    // Users

    async loginUser({ commit }, info) {
      console.log(info)
      try {
        const response = await axios.post('https://capstoneproject-1-9k8p.onrender.com/users/login', info);
        console.log(response)
        const token = response.data.token;
        const refreshToken = response.data.refreshToken
        const userId = response.data.user.userID;
        const userRole = response.data.user.userRole; 
        commit('setToken', token);
        commit('setRefreshToken', refreshToken);
        commit('setUserId', userId);
        commit('setUserRole', userRole); 
        commit('setLoggedIn', false)
        cookies.set('token', token);
        cookies.set('refreshToken', refreshToken);
        cookies.set('userId', userId);
        if (userRole === 'Admin') {
          cookies.set('role', 'Admin');
        }
        console.log('Token:', token);
        console.log('Refresh Token:', refreshToken);
        console.log('UserId:', userId);
        console.log('UserRole:', userRole);
        
        if (response.data.message) {
          toast("Logged In Successfully!!", {
            "theme": "auto",
            "type": "default",
            "position": "top-center",
            "dangerouslyHTMLString": true
          });
        }
        await router.push('/');
        location.reload();
        return userId; 
      } catch (error) {
        console.error(error);
        toast("Login Failed. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true
        });
      }
    },
    
    async signupUser({ commit }, info) {
      try {
        const response = await axios.post('https://capstoneproject-1-9k8p.onrender.com/users', info);
        const token = response.data.token;
        const userId = response.data.userId;
        const userRole = response.data.userRole; 
        commit('setToken', token);
        commit('setUserId', userId);
        commit('setUserRole', userRole); 
        cookies.set('token', token);
        if (userRole === 'admin') {
          cookies.set('role', 'admin');
        }
        console.log(token);
        
        if (response.data.message) {
          toast("Signed Up Successfully!!", {
            "theme": "auto",
            "type": "default",
            "position": "top-center",
            "dangerouslyHTMLString": true
          });
        }
        await router.push('/');
        location.reload();
      } catch (error) {
        console.error(error);
        console.error(error.response.data);
        toast("Signup Failed. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true
        });
      }
    },

    async updateUser({ commit, state: { token } }, { userId, updatedUser }) {
      try {
        const response = await axios.patch(`https://capstoneproject-1-9k8p.onrender.com/users/${userId}`, updatedUser, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        commit('updateUser', updatedUser);
        location.reload();
        toast("User updated successfully!", {
          "theme": "auto",
          "type": "default",
          "position": "top-center",
          "dangerouslyHTMLString": true,
          "timeout": 3000 
        });
      } catch (error) {
        console.error('Error updating user:', error);
        toast("Error updating user. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true,
          "timeout": 3000 
        });
      }
    },
      
    async getUserById({ commit }, userId) {
      try {
        const response = await axios.get(`https://capstoneproject-1-9k8p.onrender.com/users/${userId}`);
        const user = response.data;
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        commit('setUser', user);
      } catch (error) {
        console.error('Error getting user:', error);
        commit('setUser', null); 
      }
    },

      async getUsers({ commit }) {
        try {
          const response = await axios.get('https://capstoneproject-1-9k8p.onrender.com/users');
          commit('setUsers', response.data);
        } catch (error) {
          console.error(error);
        }
    },

    async insertUser({ commit },newUser) {
      try {
        const response = await axios.post('https://capstoneproject-1-9k8p.onrender.com/users', newUser);
        commit('setUser', response.data);
        location.reload();
        toast("User added successfully!", {
          "theme": "auto",
          "type": "default",
          "position": "top-center",
          "dangerouslyHTMLString": true,
          "timeout": 3000 
        });
      } catch (error) {
        console.error('Error adding user:', error);
        toast("Error adding user. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true,
          "timeout": 3000 
        });
      }
    },
    
    async deleteUser({ commit, state }, userId) {
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        const apiUrl = `https://capstoneproject-1-9k8p.onrender.com/users/${userId}`;
        const response = await axios.delete(apiUrl, {
          headers: {
            Authorization: `Bearer ${state.token}`
          }
        });
        if (response.data.message) {
          location.reload();
          commit('setUser', null); 
          toast("User deleted successfully!", {
            "theme": "auto",
            "type": "default",
            "position": "top-center",
            "dangerouslyHTMLString": true,
            "timeout": 3000 
          });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast("Error deleting user. Please try again.", {
          "theme": "auto",
          "type": "error",
          "position": "top-center",
          "dangerouslyHTMLString": true,
          "timeout": 3000 
        });
      }
    },
  },
  modules: {}
});


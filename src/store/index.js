import { createStore } from 'vuex'
import axios from 'axios'
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

export default createStore({
  state: {
    posts: null,
    post: null,
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
  },
  modules: {}
});


import { createStore } from 'vuex'
import axios from 'axios'
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import {useCookies} from 'vue-cookies'
import VueCookies from 'vue-cookies';
import router from '@/router';
import Swal from 'sweetalert2';
/* eslint-disable */

axios.defaults.withCredentials = true
// axios.defaults.headers = $cookies.get('token')
axios.defaults.headers.common['Authorization'] = `Bearer ${VueCookies.get('token')}`;


export default createStore({
  state: {
    userId: VueCookies.get('userId') || null,
    token: VueCookies.get('token') || null,
    isLoggedIn: !!VueCookies.get('token'),
    currentUser: null,
    posts: [],
    post: null,
    // token: null,
    // userId: null,
    user: [],
    users: [],
    userRole: null,
    isLoggedIn: false,
    commentsMap: {},
    userName: null,
    comments: [],
  },
  getters: {
    getPosts: (state) => state.posts,
    getPostById: (state) => (id) => state.posts.find((post) => post.postId === id),
    // getComments: (state) => (postId) => state.commentsMap[postId] || [],
    getComments: state => postID => state.commentsMap[postID] || []
  },
  mutations: {
      setCurrentUser(state, user) {
    state.currentUser = user;
    state.isLoggedIn = !!user?.id;
  },
    // setPosts(state, payload) {
    //   state.posts = payload
    // },
  addPost(state, post) {
    state.posts.unshift(post); // reactive
  },
    setPost(state, payload) {
      state.post = payload
    },
setPosts(state, posts) {
  const normalized = posts.map(p => ({
    ...p,
    liked: !!p.likedByUser,
    likeCount: p.likeCount || 0,
    postID: p.postID ?? p.id
  }));

  // preserve reactivity
  state.posts.splice(0, state.posts.length, ...normalized);
},
    setPostLike(state, { postID, liked, likeCount }) {
      const index = state.posts.findIndex(p => p.postID === postID);
      if (index !== -1) {
        state.posts.splice(index, 1, {
          ...state.posts[index],
          liked,
          likeCount
        });
      }
    },
setLikeCount(state, { postID, liked, likeCount }) {
  const index = state.posts.findIndex(p => p.postID === postID);
  if (index !== -1) {
    state.posts.splice(index, 1, {
      ...state.posts[index],
      liked,
      likeCount
    });
  }
},
  removePost(state, postID) {
    state.posts = state.posts.filter(p => p.postID !== postID);
  },
    setLoggedIn(state,isLoggedIn){
      state.isLoggedIn = isLoggedIn
    },
 setToken(state, token) {
    state.token = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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

    setUserRole(state, userRole) {
      state.userRole = userRole; 
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
    // Set comments for a post
    setComments(state, { postID, comments }) {
      state.commentsMap[postID] = comments.map(c => ({
        ...c,
        liked: !!c.likedByUser,
        likeCount: c.likeCount || 0
      }));

      const postIndex = state.posts.findIndex(p => p.postID === postID);
      if (postIndex !== -1) {
        state.posts.splice(postIndex, 1, {
          ...state.posts[postIndex],
          comments: state.commentsMap[postID]
        });
      }
    },
    addCommentToMap(state, { postID, comment }) {
    if (!state.commentsMap[postID]) state.commentsMap[postID] = [];
    state.commentsMap[postID].push(comment);
  },
setCommentsForPost(state, { postID, comments }) {
  state.commentsMap = { ...state.commentsMap, [postID]: comments };
},

  addComment(state, { postId, comment }) {
    if (!state.commentsMap[postId]) state.commentsMap[postId] = [];

    // Avoid duplicates
    if (!state.commentsMap[postId].some(c => c.commentID === comment.commentID)) {
      state.commentsMap[postId].push({
        ...comment,
        userName: comment.firstName && comment.lastName ? `${comment.firstName} ${comment.lastName}` : comment.userID
      });
    }
  },
    editComment(state, { postId, commentId, newText }) {
    const comments = state.commentsMap[postId] || [];
    const comment = comments.find(c => c.commentID === commentId);
    if (comment) {
      comment.commentText = newText; 
    }
  },
    deleteComment(state, { postId, commentId }) {
    if (!state.commentsMap[postId]) return;
    state.commentsMap[postId] = state.commentsMap[postId].filter(
      c => c.commentID !== commentId
    );
  },
toggleCommentLike(state, { postID, commentID, liked, likeCount }) {
      if (!state.commentsMap[postID]) return;

      state.commentsMap[postID] = state.commentsMap[postID].map(c =>
        c.commentID === commentID
          ? { ...c, liked, likeCount }
          : c
      );

      // Update the post's comments array
      const postIndex = state.posts.findIndex(p => p.postID === postID);
      if (postIndex !== -1) {
        state.posts.splice(postIndex, 1, {
          ...state.posts[postIndex],
          comments: state.commentsMap[postID]
        });
      }
    },
  },
  actions: {
// Users Actions
    // async updateUser({ commit, state: { token } }, { updatedUser }) {
    //   const userId = this.$route.params.id;
    //   if (!userId) {
    //     console.error('Error: userId is undefined');
    //     return;
    //   }
    //   try {
    //     const response = await axios.patch(`http://localhost:2000/users/${userId}`, updatedUser, {
    //       headers: {
    //         Authorization: `Bearer ${token}`
    //       }
    //     });
    //     if (response.status === 200) {
    //       commit('updateUser', updatedUser);
    //       location.reload();
    //       toast("User updated successfully!", {
    //         "theme": "auto",
    //         "type": "default",
    //         "position": "top-center",
    //         "dangerouslyHTMLString": true
    //       });
    //     } else {
    //       console.error('Error updating user:', response.data);
    //       toast("Error updating user. Please try again.", {
    //         "theme": "auto",
    //         "type": "error",
    //         "position": "top-center",
    //         "dangerouslyHTMLString": true
    //       });
    //     }
    //   } catch (error) {
    //     console.error('Error updating user:', error);
    //     toast("Error updating user. Please try again.", {
    //       "theme": "auto",
    //       "type": "error",
    //       "position": "top-center",
    //       "dangerouslyHTMLString": true
    //     });
    //   }
    // },
      
    // Users

async loginUser({ commit }, info) {
  try {
    const response = await axios.post('http://localhost:2000/users/login', info);
    const { token, refreshToken, user } = response.data;

    VueCookies.set('token', token, '1h');
    VueCookies.set('refreshToken', refreshToken, '7d');
    VueCookies.set('userId', user.userID);

    commit('setToken', token);
    commit('setRefreshToken', refreshToken);
    commit('setUserId', user.userID);
    commit('setUserRole', user.userRole);
    commit('setLoggedIn', true);

    toast("Logged In Successfully!", {
      theme: "auto",
      type: "default",
      position: "top-center",
      timeout: 3000
    });

    await router.push('/');
    location.reload();

  } catch (error) {
    console.error(error);
    toast("Login Failed. Please try again.", {
      theme: "auto",
      type: "error",
      position: "top-center",
      timeout: 3000
    });
  }
},
    
    async signupUser({ commit }, info) {
      try {
        const response = await axios.post('http://localhost:2000/users', info);
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
        const response = await axios.patch(`http://localhost:2000/users/${userId}`, updatedUser, {
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
        const response = await axios.get(`http://localhost:2000/users/${userId}`);
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
          const response = await axios.get('http://localhost:2000/users');
          commit('setUsers', response.data);
        } catch (error) {
          console.error(error);
        }
    },

    async insertUser({ commit },newUser) {
      try {
        const response = await axios.post('http://localhost:2000/users', newUser);
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
        const apiUrl = `http://localhost:2000/users/${userId}`;
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

    // Posts Actions
        
async getPosts({ commit }) {
  try {
    const token = VueCookies.get('token');
    const userId = VueCookies.get('userId'); // get the logged-in user's ID

    // 1️⃣ Fetch all posts
    const { data: postsData } = await axios.get('http://localhost:2000/posts', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // 2️⃣ Fetch user's liked posts
    let likedPostIDs = [];
    if (userId && token) {
      const { data: likedData } = await axios.get(`http://localhost:2000/posts/user/${userId}/liked-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      likedPostIDs = likedData.map(p => p.postID);
    }

    // 3️⃣ Merge liked info into posts
    const normalizedPosts = postsData.map(post => ({
      ...post,
      liked: likedPostIDs.includes(post.postID),
      likeCount: post.likeCount || 0,
      postID: post.postID ?? post.id,
    }));

    commit('setPosts', normalizedPosts);

  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }
},


async getPost({ commit, dispatch }, postId) {
  if (!postId) return;
  const { data } = await axios.get(`http://localhost:2000/posts/${postId}`);
  commit('setPost', data);

  // Fetch its comments
  dispatch('getComments', postId);
},

async createPost({ commit }, postData) {
  try {
    const token = VueCookies.get('token');
    if (!token) throw new Error('Not logged in');

    const response = await axios.post(
      'http://localhost:2000/posts',
      postData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const savedPost = {
      ...response.data,
      liked: false,
      likeCount: 0
    };

    commit('addPost', savedPost);

    toast("Post created successfully!", {
      theme: "auto",
      type: "default",
      position: "top-center"
    });

    return savedPost;

  } catch (err) {
    console.error("Error creating post:", err);
    throw err;
  }
},

async toggleLike({ commit, state }, postID) {
  if (!state.isLoggedIn) throw new Error('User not logged in');
  const token = VueCookies.get('token');

  try {
    const response = await axios.post(
      `http://localhost:2000/posts/${postID}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { liked, likeCount } = response.data;
    commit('setLikeCount', { postID, liked, likeCount });
    return response.data;
  } catch (err) {
    console.error('Error toggling like:', err);
    throw err;
  }
},

// Update a post (only if it's your own)
 async updatePost({ commit }, { postID, title, content, imageFile }) {
    const token = VueCookies.get('token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);

    const response = await axios.patch(
      `http://localhost:2000/posts/${postID}`,
      formData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    );

    return response.data; 
  },

  // Edit shared post
async editSharedPost({ commit, state }, { postID, content }) {
  try {
    const token = VueCookies.get('token');
    const response = await axios.patch(
      `http://localhost:2000/posts/shared/${postID}`,
      { content }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updatedPost = response.data.post;

    // Update local store
    const index = state.posts.findIndex(p => p.postID === postID);
    if (index !== -1) {
      const newPosts = [...state.posts];
      newPosts[index] = { ...newPosts[index], ...updatedPost };
      commit('setPosts', newPosts);
    }

    return updatedPost;
  } catch (error) {
    console.error('Error editing shared post:', error);
    throw error;
  }
},

// Delete Shared Post
async deleteSharedPost({ commit }, postID) {
  try {
    if (!postID) throw new Error("PostID is required");

    await axios.delete(`http://localhost:2000/posts/${postID}/shared`);

    // Remove the shared post from Vuex state
    commit('removePost', postID);

    return true;

  } catch (err) {
    console.error('Error deleting shared post:', err);
    throw err;
  }
},


    // Comments Actions
    // Fetch all comments for a post
async getComments({ commit }, postID) {
  try {
    const response = await axios.get(`http://localhost:2000/posts/${postID}/comments`);
    const comments = response.data;
    commit('setComments', { postID, comments });
    return comments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
},

// Add a new comment
  async addComment({ commit }, { postID, commentText }) {
    try {
      const token = VueCookies.get('token');
      if (!token) throw new Error('Not logged in');

      const response = await axios.post(
        `http://localhost:2000/posts/${postID}/comments`,
        { commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newComment = {
        commentID: response.data.commentID,
        userName: response.data.userName || 'You',
        commentText: response.data.commentText
      };

      commit('addCommentToMap', { postID, comment: newComment });

      return newComment; 
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  },

async editComment({ commit, state }, { postId, commentId, newText }) {
  try {
    const token = VueCookies.get('token'); // for auth if needed
    // send PATCH request to backend
    await axios.patch(
      `http://localhost:2000/posts/comments/${commentId}`,
      { commentText: newText },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // update Vuex state instantly
    commit('editComment', { postId, commentId, newText });
    // removed toast, assuming an alert handles user feedback

  } catch (error) {
    console.error('Error editing comment:', error);
    // optionally handle error with alert instead
  }
},

async deleteComment({ commit, state }, { postId, commentId }) {
    try {
      const token = VueCookies.get('token');
      await axios.delete(`http://localhost:2000/posts/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove comment from Vuex state
      const comments = state.commentsMap[postId] || [];
      const updatedComments = comments.filter(c => c.commentID !== commentId);
      commit('setComments', { postId, comments: updatedComments });

    } catch (error) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  },

  // Toggle like on a comment
async toggleCommentLike({ commit }, { postID, commentID }) {
  try {
    const token = VueCookies.get('token');

    const { data } = await axios.post(
      `http://localhost:2000/posts/comments/${commentID}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    commit('toggleCommentLike', {
      postID,
      commentID,
      liked: data.liked,
      likeCount: data.likeCount
    });
  } catch (err) {
    console.error("Error liking comment:", err);
  }
},

  toggleCommentLikeInMap(state, { postID, commentID, liked, likeCount }) {
  if (!state.commentsMap[postID]) return;

  state.commentsMap[postID] = state.commentsMap[postID].map(comment =>
    comment.commentID === commentID
      ? { ...comment, liked, likeCount }
      : comment
  );

  const postIndex = state.posts.findIndex(p => p.postID === postID);
  if (postIndex !== -1) {
    state.posts[postIndex] = {
      ...state.posts[postIndex],
      comments: state.commentsMap[postID]
    };
  }
},

  },
  modules: {}
});


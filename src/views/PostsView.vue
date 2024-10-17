<template>
    <div class="posts-view">
      <h1>Posts</h1>
      <div v-if="loading">Loading posts...</div>
      <div v-else-if="error">{{ error }}</div>
      <ul v-else>
        <li v-for="post in posts" :key="post.id" class="post-item">
          <h2>{{ post.title }}</h2>
          <p>{{ post.content }}</p>
          <p><strong>By:</strong> {{ post.author }}</p>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import { mapGetters } from 'vuex';
  
  export default {
    name: 'PostsView',
    data() {
      return {
        loading: true,
        error: null,
      };
    },
    computed: {
      ...mapGetters(['getPosts']),
      posts() {
        return this.getPosts || [];
      },
    },
    async created() {
      try {
        await this.$store.dispatch('getPosts');
      } catch (err) {
        this.error = 'Failed to fetch posts.';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
  };
  </script>
  
  <style scoped>
  .posts-view {
    padding: 20px;
  }
  
  .post-item {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  h2 {
    font-size: 20px;
    margin: 0;
  }
  </style>
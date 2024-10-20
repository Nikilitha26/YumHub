<template>
  <div class="posts-view">
    <h1>Posts</h1>
    <div v-if="loading">Loading posts...</div>
    <div v-else-if="error">{{ error }}</div>
    <ul v-else>
      <li v-for="post in posts" :key="post.id" class="post-item">
        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
        <img :src="post.imageUrl" alt="Post Image" />
        <p><strong>By:</strong> {{ post.author }}</p>
        <div class="post-actions">
          <i class="fas fa-comment" @click="navigateToComments(post.id)"></i>
          <span>{{ post.commentsCount }} comments</span>
          <i :class="['fas', 'fa-heart', post.liked ? 'liked' : '']" @click="toggleLike(post)"></i>
          <span>{{ post.likeCount }} likes</span>
          <i class="fas fa-share" @click="sharePost(post)"></i>
          <span>{{ post.sharesCount }} shares</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import '@fortawesome/fontawesome-free/css/all.css';

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
  methods: {
    navigateToComments(postId) {
      // Navigate to the comments section
      console.log('Navigate to comments for post:', postId);
    },
    toggleLike(post) {
      // Ensure likeCount is a number
      if (typeof post.likeCount !== 'number') {
        post.likeCount = 0;
      }
      // Toggle like status and update count
      post.liked = !post.liked;
      post.likeCount += post.liked ? 1 : -1;
    },
    sharePost(post) {
      // Ensure sharesCount is a number
      if (typeof post.sharesCount !== 'number') {
        post.sharesCount = 0;
      }
      // Increase share count
      post.sharesCount += 1;
      console.log('Share post:', post);
    }
  }
}
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

.post-actions {
  display: flex;
  gap: 10px;
}

.post-actions i {
  cursor: pointer;
  font-size: 1.5em;
}

.fa-heart {
  color: grey; /* Default color */
}

.liked {
  color: rgb(241, 44, 77);
}
</style>

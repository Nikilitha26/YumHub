<template>
  <div class="posts-view">
    <div class="header">
      <h1>Posts</h1>
      <button class="add-post-btn" @click="openCreatePost">
        <i class="fas fa-plus-circle"></i> Create Post
      </button>
    </div>

    <div v-if="loading">Loading posts...</div>
    <div v-else-if="error">{{ error }}</div>

    <!-- Create/Edit Post Modal -->
    <div v-if="showPostModal" class="post-modal-backdrop" @click.self="closePostModal">
      <div class="post-modal">
        <h3>{{ editingPost ? 'Edit Post' : 'Create New Post' }}</h3>
        <form @submit.prevent="savePost">
          <div class="form-group">
            <label>Caption</label>
            <input 
              v-model="postForm.title" 
              type="text" 
              placeholder="Enter caption..."
              required
            >
          </div>
          
          <div class="form-group">
            <label>Content</label>
            <textarea 
              v-model="postForm.content" 
              placeholder="What's on your mind?"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Image</label>
            <input 
              type="file" 
              @change="handleImageUpload" 
              accept="image/*"
            >
            <img 
              v-if="postForm.imageUrl" 
              :src="postForm.imageUrl" 
              class="preview-image"
              alt="Preview"
            >
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-cancel" @click="closePostModal">
              Cancel
            </button>
            <button type="submit" class="btn btn-save">
              {{ editingPost ? 'Save Changes' : 'Create Post' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="posts-list">
      <div
        v-for="post in posts"
        :key="post.id"
        class="post-item"
        :data-post-id="post.id"
      >
        <!-- Edit button for user's own posts -->
        <button 
          v-if="post.author === 'You'"
          class="edit-post-btn" 
          @click="openEditPost(post)"
        >
          <i class="fas fa-edit"></i>
        </button>

        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
        <img v-if="post.imageUrl" :src="post.imageUrl" alt="Post Image" class="post-image" />
        <p><strong>By:</strong> {{ post.author }}</p>

        <div class="post-actions">
          <i class="fas fa-comment" @click="toggleCommentInput(post.id)"></i>
          <span>{{ computedCommentsCount(post) }} comments</span>

          <i
            :class="['fas', 'fa-heart', post.liked ? 'liked' : '']"
            @click="toggleLike(post)"
          ></i>
          <span>{{ post.likeCount || 0 }} likes</span>

          <i class="fas fa-share" @click="openSharePopup(post.id)"></i>
          <span>{{ post.sharesCount || 0 }} shares</span>
        </div>

        <!-- Updated Comments Section -->
        <div class="comments-section">
          <div v-if="commentsMap[post.id] && commentsMap[post.id].length" class="comments-list">
            <div
              v-for="(comment, idx) in commentsMap[post.id]"
              :key="idx"
              :class="['comment-bubble', comment.author === 'You' ? 'comment-mine' : 'comment-other']"
            >
              <div class="comment-content">
                <div class="comment-header">
                  <strong>{{ comment.author }}</strong>
                  <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <p>{{ comment.text }}</p>
                <div class="comment-actions">
                  <button @click="toggleReplyInput(post.id, idx)" class="reply-btn">
                    <i class="fas fa-reply"></i> Reply
                  </button>
                </div>

                <!-- Replies section -->
                <div v-if="comment.replies && comment.replies.length" class="replies-list">
                  <div
                    v-for="(reply, replyIdx) in comment.replies"
                    :key="replyIdx"
                    :class="['reply-bubble', reply.author === 'You' ? 'comment-mine' : 'comment-other']"
                  >
                    <div class="comment-content">
                      <div class="comment-header">
                        <strong>{{ reply.author }}</strong>
                        <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
                      </div>
                      <p>{{ reply.text }}</p>
                    </div>
                  </div>
                </div>

                <!-- Reply input -->
<div v-if="showReplyInput(post.id, idx)" class="reply-input">
  <textarea
    v-model="replyInputMap[`${post.id}-${idx}`]"
    placeholder="Write a reply..."
    rows="2"
  ></textarea>
  <button class="send-btn" @click="sendReply(post, idx)">
    <i class="fas fa-paper-plane"></i>
  </button>
</div>
              </div>
            </div>
          </div>

          <div v-if="showCommentInputMap[post.id]" class="comment-input">
            <textarea
              v-model="commentInputMap[post.id]"
              placeholder="Write a comment..."
              rows="2"
            ></textarea>
            <button class="send-btn" @click="sendComment(post)">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>

        <!-- Share Modal -->
        <div
          v-if="showShareInputMap[post.id]"
          class="share-modal-backdrop"
          @click.self="closeSharePopup(post.id)"
        >
          <div class="share-modal">
            <h3>Share post</h3>
            <textarea
              v-model="shareInputMap[post.id]"
              placeholder="Add optional text (leave blank to share without text)"
              rows="4"
            ></textarea>
            <div class="share-actions">
              <button class="btn btn-cancel" @click="closeSharePopup(post.id)">
                Cancel
              </button>
              <button class="btn btn-send" @click="sendShare(post)">
                <i class="fas fa-paper-plane"></i> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import '@fortawesome/fontawesome-free/css/all.css';
import Swal from 'sweetalert2';

export default {
  name: 'PostsView',
  data() {
    return {
      loading: true,
      error: null,
      notificationMessage: '',
      commentsMap: {},
      commentInputMap: {},
      showCommentInputMap: {},
      sharesMap: {},
      shareInputMap: {},
      showShareInputMap: {},
      showPostModal: false,
      editingPost: null,
      postForm: {
        title: '',
        content: '',
        imageUrl: '',
        author: 'You'
      },
      replyInputMap: {},
      showReplyInputMap: {}
    };
  },

  computed: {
    ...mapGetters(['getPosts']),
    posts() {
      return this.getPosts ? this.getPosts : [];
    },
  },

  watch: {
    posts: {
      handler(newPosts) {
        newPosts.forEach(p => {
          if (!(p.id in this.commentsMap)) {
            this.commentsMap[p.id] = [];
          }
          if (!(p.id in this.commentInputMap)) {
            this.commentInputMap[p.id] = '';
          }
          if (!(p.id in this.showCommentInputMap)) {
            this.showCommentInputMap[p.id] = false;
          }
          if (!(p.id in this.sharesMap)) {
            this.sharesMap[p.id] = [];
          }
          if (!(p.id in this.shareInputMap)) {
            this.shareInputMap[p.id] = '';
          }
          if (!(p.id in this.showShareInputMap)) {
            this.showShareInputMap[p.id] = false;
          }
        });
      },
      immediate: true,
      deep: true
    }
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
    // Create/Edit Post Methods
    openCreatePost() {
      this.editingPost = null;
      this.postForm = {
        title: '',
        content: '',
        imageUrl: '',
        author: 'You'
      };
      this.showPostModal = true;
    },

    openEditPost(post) {
      this.editingPost = post;
      this.postForm = { ...post };
      this.showPostModal = true;
    },

    closePostModal() {
      this.showPostModal = false;
      this.editingPost = null;
      this.postForm = {
        title: '',
        content: '',
        imageUrl: '',
        author: 'You'
      };
    },

    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.postForm.imageUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },

    async savePost() {
      try {
        if (this.editingPost) {
          await this.$store.dispatch('updatePost', {
            id: this.editingPost.id,
            ...this.postForm
          });
          this.showSweet('Post updated successfully!');
        } else {
          await this.$store.dispatch('createPost', this.postForm);
          this.showSweet('Post created successfully!');
        }
        this.closePostModal();
      } catch (error) {
        console.error('Error saving post:', error);
        this.showSweet('Error saving post. Please try again.');
      }
    },

    // Comment Methods
    toggleCommentInput(postId) {
      this.showCommentInputMap[postId] = !this.showCommentInputMap[postId];
      if (this.showCommentInputMap[postId]) {
        this.$nextTick(() => {
          const el = this.$el.querySelector(`div[data-post-id="${postId}"] .comment-input textarea`);
          if (el) el.focus();
        });
      }
    },

    computedCommentsCount(post) {
      const local = this.commentsMap[post.id] ? this.commentsMap[post.id].length : 0;
      return local || post.commentsCount || 0;
    },

    sendComment(post) {
      const text = (this.commentInputMap[post.id] || '').trim();
      if (!text) return;
      const comment = {
        author: 'You',
        text,
        createdAt: new Date().toISOString(),
        replies: []
      };
      if (!this.commentsMap[post.id]) {
        this.commentsMap[post.id] = [];
      }
      this.commentsMap[post.id].push(comment);
      if (typeof post.commentsCount === 'number') {
        post.commentsCount += 1;
      } else {
        post.commentsCount = (this.commentsMap[post.id] || []).length;
      }
      this.commentInputMap[post.id] = '';
      this.showSweet('Comment sent!');
    },

    // Reply Methods
    toggleReplyInput(postId, commentIdx) {
      const key = `${postId}-${commentIdx}`;
      if (!this.replyInputMap[key]) {
        this.$set(this.replyInputMap, key, '');
      }
      this.$set(this.showReplyInputMap, key, !this.showReplyInputMap[key]);
    },

    showReplyInput(postId, commentIdx) {
      return this.showReplyInputMap[`${postId}-${commentIdx}`];
    },

    sendReply(post, commentIdx) {
      const key = `${post.id}-${commentIdx}`;
      const text = (this.replyInputMap[key] || '').trim();
      if (!text) return;

      if (!this.commentsMap[post.id][commentIdx].replies) {
        this.$set(this.commentsMap[post.id][commentIdx], 'replies', []);
      }

      this.commentsMap[post.id][commentIdx].replies.push({
        author: 'You',
        text,
        createdAt: new Date().toISOString()
      });

      this.replyInputMap[key] = '';
      this.showReplyInputMap[key] = false;
      this.showSweet('Reply sent!');
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    },

    // Like Methods
    toggleLike(post) {
      if (typeof post.likeCount !== 'number') {
        post.likeCount = 0;
      }
      post.liked = !post.liked;
      post.likeCount += post.liked ? 1 : -1;
    },

    // Share Methods
    openSharePopup(postId) {
      this.showShareInputMap[postId] = true;
      this.$nextTick(() => {
        const el = this.$el.querySelector(`div[data-post-id="${postId}"] .share-modal textarea`);
        if (el) el.focus();
      });
    },

    closeSharePopup(postId) {
      this.showShareInputMap[postId] = false;
      this.shareInputMap[postId] = '';
    },

    sendShare(post) {
      const text = (this.shareInputMap[post.id] || '').trim();
      const share = {
        author: 'You',
        text: text || '',
        createdAt: new Date().toISOString()
      };
      if (!this.sharesMap[post.id]) {
        this.sharesMap[post.id] = [];
      }
      this.sharesMap[post.id].push(share);
      if (typeof post.sharesCount === 'number') {
        post.sharesCount += 1;
      } else {
        post.sharesCount = (this.sharesMap[post.id] || []).length;
      }
      this.showShareInputMap[post.id] = false;
      this.shareInputMap[post.id] = '';
      this.showSweet('Post shared!');
    },

    // Notification Methods
    showSweet(message) {
      Swal.fire({
        title: message,
        width: 320,
        padding: '10px 14px',
        timer: 1400,
        showConfirmButton: false,
        position: 'center',
        background: 'rgba(223, 240, 216, 0.95)',
        color: '#3c763d',
        timerProgressBar: true,
        allowOutsideClick: false,
        didOpen: () => {
          if (this.$el && this.$el.classList) this.$el.classList.add('blur');
          const p = Swal.getPopup && Swal.getPopup();
          if (p) {
            p.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
            p.style.fontSize = '14px';
            p.style.borderRadius = '8px';
          }
        },
        willClose: () => {
          if (this.$el && this.$el.classList) this.$el.classList.remove('blur');
        }
      });
    }
  }
};
</script>

<style scoped>
/* Layout & Container Styles */
.posts-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: #f8f9fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

/* Posts List Styles */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.post-item {
  background: white;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Post Content Styles */
.post-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin: 10px 0;
}

h1 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0;
}

h2 {
  font-size: 20px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

/* Action Buttons */
.add-post-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.add-post-btn:hover {
  background: #0056b3;
}

.edit-post-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6c757d;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-post-btn:hover {
  color: #007bff;
  background: rgba(0,0,0,0.05);
}

/* Post Actions */
.post-actions {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.post-actions i {
  cursor: pointer;
  font-size: 1.2em;
  transition: transform 0.2s;
}

.post-actions i:hover {
  transform: scale(1.1);
}

.fa-heart {
  color: #6c757d;
}

.liked {
  color: #dc3545;
}

/* Comments Section */
.comments-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.comment-bubble {
  display: flex;
  max-width: 85%;
}

.comment-mine {
  margin-left: auto;
}

.comment-content {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 12px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.comment-mine .comment-content {
  background: #e3f2fd;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 12px;
  color: #6c757d;
  margin-left: 8px;
}

.comment-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.reply-btn {
  background: transparent;
  border: none;
  color: #6c757d;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.reply-btn:hover {
  background: rgba(0,0,0,0.05);
  color: #007bff;
}

.replies-list {
  margin-top: 12px;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-bubble {
  max-width: 90%;
}

.reply-input {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  padding-left: 24px;
}

/* Input Styles */
.comment-input,
.reply-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  align-items: flex-end;
}

.comment-input textarea,
.reply-input textarea {
  flex: 1;
  resize: vertical;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ddd;
  min-height: 40px;
  max-height: 120px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.comment-input textarea:focus,
.reply-input textarea:focus {
  outline: none;
  border-color: #007bff;
}

/* Modal Styles */
.post-modal-backdrop,
.share-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.post-modal,
.share-modal {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  margin-top: 10px;
  border-radius: 6px;
  object-fit: cover;
}

/* Button Styles */
.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f8f9fa;
  color: #6c757d;
}

.btn-cancel:hover {
  background: #e9ecef;
}

.btn-save,
.btn-send {
  background: #007bff;
  color: white;
}

.btn-save:hover,
.btn-send:hover {
  background: #0056b3;
}

.send-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 8px;
  color: #007bff;
  transition: all 0.2s;
}

.send-btn:hover {
  color: #0056b3;
  transform: scale(1.1);
}

/* Chat Bubble Triangles */
.comment-content::before {
  content: '';
  position: absolute;
  top: 8px;
  border: 8px solid transparent;
}

.comment-other .comment-content::before {
  left: -16px;
  border-right-color: #f8f9fa;
}

.comment-mine .comment-content::before {
  right: -16px;
  border-left-color: #e3f2fd;
}

/* Modal Actions */
.modal-actions,
.share-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Sweet Alert Styles */
.popup-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 320px;
  width: auto;
  padding: 12px 20px;
  font-size: 14px;
  background-color: rgba(223, 240, 216, 0.95);
  color: #3c763d;
  border: 1px solid #d6e9c6;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  z-index: 2300;
  text-align: center;
}

/* Blur Effect */
.posts-view.blur {
  filter: blur(5px);
  transition: filter 0.2s;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .posts-view {
    padding: 15px;
  }

  .post-modal,
  .share-modal {
    padding: 20px;
    margin: 15px;
  }

  .post-actions {
    gap: 15px;
  }

  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 18px;
  }

  .comment-bubble {
    max-width: 90%;
  }

  .replies-list {
    padding-left: 12px;
  }
}
</style>


<template>
  <div class="posts-view">
    <div class="header">
      <h1>YumHub</h1>
      <button class="add-post-btn" @click="openCreatePost">
        <i class="fas fa-plus-circle"></i> Create Post
      </button>
    </div>

    <div v-if="loading">Loading posts...</div>
    <div v-else-if="error">{{ error }}</div>

    <!-- Create/Edit Post Modal -->
<!-- Create/Edit Post Modal -->
<div v-if="showPostModal" class="post-modal-backdrop" @click.self="closePostModal">
  <div class="post-modal">
    <h3>{{ editingPost ? 'Edit Post' : 'Create New Post' }}</h3>
    <form @submit.prevent="savePost">
      <!-- Caption -->
      <div class="form-group">
        <label>Caption</label>
        <input 
          v-model="postForm.title" 
          type="text" 
          placeholder="Enter caption..."
          required
        >
      </div>
      
      <!-- Content -->
      <div class="form-group">
        <label>Content</label>
        <textarea 
          v-model="postForm.content" 
          placeholder="What's on your mind?"
          rows="4"
          required
        ></textarea>
      </div>

      <!-- Image (only editable for your own posts) -->
      <div class="form-group">
        <label>Image</label>
        <input
          type="file"
          accept="image/*"
          @change="handleImageUpload"
        />
        <small v-if="!postForm.canEditImage" class="text-muted">
          You cannot change the image of a shared post.
        </small>
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
        v-for="post in posts" :key="post.postID"
        class="post-item"
        :data-post-id="post.id"
      >
<!-- Edit button for user's own or shared posts -->
<button 
  v-if="String(post.authorID) === String(currentUser.id) || post.sharedFromUserName === currentUser.name"
  class="edit-post-btn" 
  @click="openEditPost(post)"
>
  <i class="fas fa-edit"></i>
</button>

<!-- 🗑️ Delete button -->
<!-- Delete button -->
<button 
  v-if="String(post.authorID) === String(currentUser.id)" 
  class="delete-post-btn" 
  @click="deletePost(post.postID)"
  title="Delete Post"
>
  <i class="fas fa-trash-alt"></i>
</button>




        <h2>{{ post.title }}</h2>
        <p>{{ post.content }}</p>
        <img v-if="post.imageUrl" :src="post.imageUrl" alt="Post Image" class="post-image" />
        <p><strong>By:</strong> {{ post.author }}</p>

<div class="post-actions">
  <!-- 💬 Comments -->
  <i class="fas fa-comment" @click="toggleComments(post.postID); toggleCommentInput(post.postID)"></i>
  <span>{{ computedCommentsCount(post) }}</span>

  <!-- ❤️ Likes -->
<i 
  :class="['fas', 'fa-heart', post.liked ? 'liked' : '']"
  @click="toggleLike(post)"
></i>
  <span>{{ post.likeCount }} {{ post.likeCount === 1 ? 'Like' : 'Likes' }}</span>

  <!-- 🔁 Shares -->
  <i class="fas fa-share" @click="openSharePopup(post.postID)"></i>
  <span>{{ post.shareCount || 0 }} {{ post.shareCount === 1 ? 'Share' : 'Shares' }}</span>
</div>

<!-- ✅ Shared From Label -->
<div v-if="post.sharedFromUserName" class="shared-meta">
  <p class="shared-from">
    🔁 Shared from <strong>{{ post.sharedFromUserName }}</strong>
  </p>

  <!-- 🗑️ Delete Shared Post Button -->
<button @click="deleteSharedPost(post.postID)">
  <i class="fas fa-trash-alt"></i> Delete Shared Post
</button>
</div>


<!-- 📨 Share Popup -->
<div
  v-if="showShareInputMap[post.postID]"
  class="share-modal-backdrop"
  @click.self="closeSharePopup(post.postID)"
>
  <div class="share-modal">
    <h3>Share Post</h3>
    <textarea
      v-model="shareInputMap[post.postID]"
      placeholder="Add optional text (leave blank to share without text)"
      rows="4"
    ></textarea>

    <div class="share-actions">
      <button class="btn btn-cancel" @click="closeSharePopup(post.postID)">
        Cancel
      </button>
      <button class="btn btn-send" @click="sendShare(post)">
        <i class="fas fa-paper-plane"></i> Send
      </button>
    </div>
  </div>

</div>

<!-- Comments -->
<div 
  v-if="showCommentsMap[post.postID]" 
  class="comments-section"
>

<div 
  v-for="comment in commentsMap[post.postID]" 
  :key="comment.commentID" 
  class="comment-item"
>
  <strong>{{ comment.userName }}:</strong>

  <!-- Editable Comment -->
  <span v-if="editingCommentMap[comment.commentID]">
    <textarea v-model="editCommentInputMap[comment.commentID]" rows="2"></textarea>
    <button @click="saveComment(post, comment)">Save</button>
    <button @click="cancelEditComment(comment)">Cancel</button>
  </span>

  <span v-else>{{ comment.commentText }}</span>

  <!-- COMMENT LIKE BUTTON ❤️ -->
  <span class="comment-like-btn" @click="toggleCommentLike(post.postID, comment)">
    <i 
      :class="[
        'fas',
        'fa-heart',
        comment.liked ? 'liked' : ''
      ]"
    ></i>
    <span>{{ comment.likeCount || 0 }}</span>
  </span>

  <!-- Edit -->
  <button 
    class="edit-comment-btn" 
    v-if="!editingCommentMap[comment.commentID]"
    @click="editComment(comment)"
  >
    <i class="fas fa-edit"></i>
  </button>

  <!-- Delete -->
  <button @click="deleteComment(post.postID, comment.commentID)">🗑️</button>
</div>

  <!-- Add New Comment -->
  <div v-if="showCommentInputMap[post.postID]" class="comment-input">
    <textarea
      v-model="commentInputMap[post.postID]"
      placeholder="Write a comment..."
      rows="2"
    ></textarea>
    <button @click="sendComment(post)">
      <i class="fas fa-paper-plane"></i>
    </button>
  </div>
</div>


        <!-- Share Popup -->

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
import axios from 'axios'
import VueCookies from 'vue-cookies'
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
      activeCommentInput: null,
      showCommentsMap: {},
      showCommentInputMap: {},
      sharesMap: {},
      shareInputMap: {},
      showShareInputMap: {},
      showPostModal: false,
      editingPost: null,
      postForm: {
        currentPost: null, 
        imageFile: null,
        title: '',
        content: '',
        imageUrl: '',
        author: 'You'
      },
      editingCommentMap: {},   
    editCommentInputMap: {}, 
    };
  },

  computed: {
  ...mapGetters(['getPosts']),
  
  posts() {
    return this.getPosts ? this.getPosts : [];
  },

  currentUser() {
    // Adjust based on what you store in Vuex or cookies
    return {
      id: VueCookies.get('userID'),
      name: VueCookies.get('userName') 
    };
  }
  },



  watch: {
posts(newPosts) {
    newPosts.forEach(p => {
      const pid = p.postID;

      if (!this.commentsMap[pid]) this.commentsMap[pid] = [];
      if (!this.commentInputMap[pid]) this.commentInputMap[pid] = "";
      if (!this.showCommentInputMap[pid]) this.showCommentInputMap[pid] = false;
      if (!this.shareInputMap[pid]) this.shareInputMap[pid] = "";
      if (!this.showShareInputMap[pid]) this.showShareInputMap[pid] = false;
      if (!this.showCommentsMap[pid]) this.showCommentsMap[pid] = false;
    });
  }
  },

  mounted() {
  // this.commentsMap = { ...this.$store.state.commentsMap };
   this.loadPosts();
    // this.loadAllComments();
},

// async created() {
//   try {
//     const userID = VueCookies.get('userID');
//     const token = VueCookies.get('token');
 
//     // await this.loadPosts();

//     // ✅ Fetch liked comments first
//     let likedCommentIDs = [];
//     if (userID) {
//       const likedResponse = await axios.get(
//         `http://localhost:2000/users/${userID}/liked-comments`,
//         { headers: token ? { Authorization: `Bearer ${token}` } : {} }
//       );
//       likedCommentIDs = likedResponse.data.map(c =>
//         typeof c === 'object' ? c.commentID : c
//       );
//     }

//     // Now fetch comments for each post
//     for (const post of this.posts) {
//       const response = await axios.get(
//         `http://localhost:2000/posts/${post.postID}/comments`,
//         { headers: token ? { Authorization: `Bearer ${token}` } : {} }
//       );

//       const comments = response.data.map(c => ({
//         ...c,
//         userName: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.userID,
//         likeCount: c.likeCount || 0,
//         liked: likedCommentIDs.includes(c.commentID), // ✅ mark liked properly
//       }));

//       this.commentsMap[post.postID] = comments;
//     }

//   } catch (err) {
//     console.error(err);
//     this.error = "Failed to fetch posts or comments.";
//   } finally {
//     this.loading = false;
//   }
// },

  methods: {
    // Create/Edit Post Methods
 // Unified small SweetAlert toast
  showTinyToast(message, icon = 'success') {
    Swal.fire({
      title: message,
      width: 220,
      padding: '6px 10px',
      timer: 1200,
      showConfirmButton: false,
      position: 'center',
      background: 'rgba(255,255,255,0.95)',
      color: '#333',
      timerProgressBar: true,
      toast: true,
      icon: icon,
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.fontSize = '12px';
          popup.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
          popup.style.borderRadius = '6px';
        }
      }
    });
  },

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

  createPost() {
  this.openCreatePost()
},

openEditPost(post) {
  this.editingPost = post;
  this.postForm = {
    title: post.title || '',
    content: post.content || '',
    imageFile: null,
    imageUrl: post.imageUrl || '',
  };
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
    const token = VueCookies.get("token");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Not logged in",
        text: "Please log in to post.",
        background: "#fff",
        confirmButtonColor: "rgb(148, 118, 103)"
      });
      return;
    }

    if (this.editingPost) {
      // -------- EDIT MODE --------
      const postID = this.editingPost.postID;
      const isShared = !!this.editingPost.sharedFromUserName;

      const payload = {
        title: this.postForm.title,
        content: this.postForm.content
      };
      if (!isShared && this.postForm.imageUrl) {
        payload.imageUrl = this.postForm.imageUrl;
      }

      await axios.patch(
        isShared
          ? `http://localhost:2000/posts/shared/${postID}`
          : `http://localhost:2000/posts/${postID}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update Vuex posts array in-place
      const updatedPosts = this.$store.state.posts.map(p =>
        p.postID === postID ? { ...p, ...payload } : p
      );
      this.$store.commit("setPosts", updatedPosts);

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Post updated successfully",
        background: "#fff",
        confirmButtonColor: "rgb(148, 118, 103)"
      });

    } else {
      // -------- CREATE MODE --------
      const response = await axios.post(
        "http://localhost:2000/posts",
        {
          title: this.postForm.title,
          content: this.postForm.content,
          imageUrl: this.postForm.imageUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let newPost = response.data;
      newPost = {
        ...newPost,
        postID: newPost.postID ?? newPost.id,
        liked: false,
        likeCount: 0
      };

      // Initialize comment/share maps
      this.commentsMap[newPost.postID] = [];
      this.commentInputMap[newPost.postID] = "";
      this.showCommentsMap[newPost.postID] = false;
      this.showCommentInputMap[newPost.postID] = false;
      this.shareInputMap[newPost.postID] = "";
      this.showShareInputMap[newPost.postID] = false;

      // Prepend to Vuex posts
      this.$store.commit("setPosts", [newPost, ...this.$store.state.posts]);

      Swal.fire({
        icon: "success",
        title: "Created!",
        text: "Post created successfully",
        background: "#fff",
        confirmButtonColor: "rgb(148, 118, 103)"
      });
    }

    this.closePostModal();

  } catch (err) {
    console.error("Error saving post:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.response?.data?.message || "Failed to save post",
      background: "#fff",
      confirmButtonColor: "rgb(148, 118, 103)"
    });
  }
},

async loadPosts() {
  this.loading = true;
  try {
    const token = VueCookies.get('token');
    const userID = VueCookies.get('userID');

    const response = await axios.get('http://localhost:2000/posts', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    // const postsData = response.data.map(post => ({
    //   ...post,
    //   postID: post.postID ?? post.id,
    //   authorID: post.authorID, // ensure this matches the backend field
    //   author: post.authorName || post.author, // optional
    //   likeCount: post.likeCount || 0,
    //   liked: false
    // }));
    const postsData = response.data.map(post => ({
  ...post,
  postID: post.postID ?? post.id,
  authorID: post.authorID ?? post.userID, // fallback
  author: post.authorName || post.author || 'Unknown',
  likeCount: post.likeCount || 0,
  liked: false
}));


    this.$store.commit('setPosts', postsData);

    // Initialize comment & share maps
    postsData.forEach(post => {
      this.commentsMap[post.postID] = [];
      this.commentInputMap[post.postID] = "";
      this.showCommentsMap[post.postID] = false;
      this.showCommentInputMap[post.postID] = false;
      this.shareInputMap[post.postID] = "";
      this.showShareInputMap[post.postID] = false;
    });

  } catch (err) {
    console.error(err);
    this.error = "Failed to load posts.";
  } finally {
    this.loading = false;
  }
},

async deletePost(postID) {
  const result = await Swal.fire({
    title: "Delete Post?",
    text: "Are you sure you want to delete this post?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "rgb(148, 118, 103)",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    background: "#fff",
    color: "#000",
  });

  if (!result.isConfirmed) return;

  try {
    const token = VueCookies.get("token");
    await axios.delete(`http://localhost:2000/posts/${postID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Remove post from Vuex
    const updatedPosts = this.$store.state.posts.filter(p => p.postID !== postID);
    this.$store.commit("setPosts", updatedPosts);

    this.showTinyToast("Post deleted!", "success");
  } catch (err) {
    console.error("Error deleting post:", err);
    Swal.fire("Error", "Failed to delete post.", "error");
  }
},

async toggleLike(post) {
  if (!this.$store.state.isLoggedIn) {
    this.showTinyToast('Please log in to like posts.', 'error');
    return;
  }

  try {
    const token = VueCookies.get('token');

    const response = await axios.post(
      `http://localhost:2000/posts/${post.postID}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Create a new array to trigger reactivity
    const updatedPosts = this.$store.state.posts.map(p =>
      p.postID === post.postID
        ? { ...p, liked: response.data.liked, likeCount: response.data.likeCount }
        : p
    );

    // Commit the new array to Vuex
    this.$store.commit('setPosts', updatedPosts);

  } catch (err) {
    console.error('Error toggling like:', err);
    this.showTinyToast('Failed to toggle like!', 'error');
  }
},

// Send share
async sendShare(post) {
  if (!this.$store.state.isLoggedIn) {
    Swal.fire('Please log in to share posts.');
    return;
  }

  try {
    const token = VueCookies.get('token'); 
    const caption = this.shareInputMap[post.postID] || '';

    // Send share request to backend
    const response = await axios.post(
      `http://localhost:2000/posts/${post.postID}/share`,
      { caption },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Backend returns updated posts array
    const updatedPosts = response.data.map(p => ({
      ...p,
      postID: p.postID ?? p.id,
      liked: !!p.liked,
      likeCount: p.likeCount || 0
    }));

    // Commit updated posts to Vuex
    this.$store.commit('setPosts', updatedPosts);

    // Close share popup & clear input
    this.showShareInputMap[post.postID] = false;
    this.shareInputMap[post.postID] = '';

    Swal.fire('Shared!', 'Post shared successfully.', 'success');

  } catch (err) {
    console.error('Error sharing post:', err);
    Swal.fire('Error', 'Failed to share post.', 'error');
  }
},

async updatePost() {
  if (!this.editingPost) return;

  try {
    const token = VueCookies.get("token");
    if (!token) throw new Error("Not logged in");

    const postID = this.editingPost.postID;

    // Determine if it's a shared post
    const isShared = !!this.editingPost.sharedFromUserName;
    const url = isShared 
      ? `http://localhost:2000/posts/shared/${postID}` 
      : `http://localhost:2000/posts/${postID}`;

    const payload = {
      title: this.postForm.title,
      content: this.postForm.content
    };

    // Only allow image update if not shared
    if (!isShared && this.postForm.imageUrl) {
      payload.imageUrl = this.postForm.imageUrl;
    }

    const response = await axios.patch(url, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Update local Vuex store immediately
    const updatedPosts = this.$store.state.posts.map(p =>
      p.postID === postID ? { ...p, ...payload } : p
    );
    this.$store.commit("setPosts", updatedPosts);

    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: "Post updated successfully",
      background: "#fff",
      confirmButtonColor: "rgb(148, 118, 103)"
    });

    this.closePostModal();

  } catch (err) {
    console.error("Error updating post:", err);
    Swal.fire({
      icon: "error",
      title: "Failed to update",
      text: err.response?.data?.message || err.message,
      background: "#fff",
      confirmButtonColor: "rgb(148, 118, 103)"
    });
  }
},

// Delete shared post
async deleteSharedPost(postID) {
  const result = await Swal.fire({
    title: "Delete Shared Post?",
    text: "Are you sure you want to delete this shared post?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "rgb(148, 118, 103)",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
    background: "#fff",
    color: "#000",
  });

  if (!result.isConfirmed) return;

  try {
    await this.$store.dispatch('deleteSharedPost', postID);
    Swal.fire('Deleted!', 'Your shared post has been deleted.', 'success');
  } catch (err) {
    Swal.fire('Error', 'Failed to delete shared post.', 'error');
  }
},


  // Comments Methods
  toggleComments(postID) {
    this.showCommentsMap[postID] = !this.showCommentsMap[postID];
  },

toggleCommentInput(postID) {
  if (!this.showCommentInputMap) this.showCommentInputMap = {};
  this.showCommentInputMap[postID] = !this.showCommentInputMap[postID];
},

  computedCommentsCount(post) {
    return this.commentsMap[post.postID]?.length || 0;
  },

async sendComment(post) {
  const postID = post.postID;
  const commentText = this.commentInputMap[postID];

  if (!commentText?.trim()) {
    Swal.fire('Oops', 'Comment cannot be empty!', 'warning');
    return;
  }

  const tempComment = {
    commentID: Date.now(),
    userName: 'You',
    commentText,
    liked: false,   // ✅ always define liked
    likeCount: 0
  };

  if (!this.commentsMap[postID]) this.commentsMap[postID] = [];
  this.commentsMap[postID].push(tempComment);

  this.commentInputMap[postID] = "";

  try {
    const savedComment = await this.$store.dispatch('addComment', {
      postID,
      commentText
    });

    if (savedComment?.commentID) {
      const index = this.commentsMap[postID].findIndex(c => c.commentID === tempComment.commentID);
      if (index !== -1) this.commentsMap[postID][index].commentID = savedComment.commentID;
    }

    // Optional: refresh to get new likes from backend
    await this.fetchComments(postID);
  } catch (err) {
    console.error(err);
    this.commentsMap[postID] = this.commentsMap[postID].filter(c => c.commentID !== tempComment.commentID);
    this.showTinyToast('Failed to add comment!', 'error');
  }
},

async fetchComments(postID) {
  try {
    const userID = VueCookies.get('userID');
    const token = VueCookies.get('token');

    const response = await axios.get(
      `http://localhost:2000/posts/${postID}/comments`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );

    let likedCommentIDs = [];
    if (userID) {
      const likedResponse = await axios.get(
        `http://localhost:2000/users/${userID}/liked-comments`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      likedCommentIDs = likedResponse.data.map(c => typeof c === 'object' ? c.commentID : c);
    }

    const comments = response.data.map(c => ({
      ...c,
      userName: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.userID,
      likeCount: c.likeCount || 0,
      liked: likedCommentIDs.includes(c.commentID),
    }));
    this.commentsMap[postID] = comments;
  } catch (err) {
    console.error('Error fetching comments:', err);
  }
},

  editComment(comment) {
    this.editingCommentMap = { ...this.editingCommentMap, [comment.commentID]: true };
    this.editCommentInputMap = { ...this.editCommentInputMap, [comment.commentID]: comment.commentText };
  },

  cancelEditComment(comment) {
    this.editingCommentMap = { ...this.editingCommentMap, [comment.commentID]: false };
    this.editCommentInputMap = { ...this.editCommentInputMap, [comment.commentID]: '' };
  },

  async saveComment(post, comment) {
    const newText = this.editCommentInputMap[comment.commentID];
    if (!newText?.trim()) return;

    try {
      await this.$store.dispatch('editComment', {
        postId: post.postID,
        commentId: comment.commentID,
        newText
      });

      const index = this.commentsMap[post.postID].findIndex(c => c.commentID === comment.commentID);
      if (index !== -1) this.commentsMap[post.postID][index].commentText = newText;

      this.cancelEditComment(comment);
      this.showTinyToast('Comment updated!');
    } catch (err) {
      console.error('Failed to update comment:', err);
      this.showTinyToast('Failed to update comment!', 'error');
    }
  },

  async deleteComment(postId, commentId) {
    const result = await Swal.fire({
      title: "Delete Comment?",
      text: "Are you sure you want to delete this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "rgb(148, 118, 103)",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      background: "#fff",
      color: "#000",
      width: 220,
      padding: '6px 10px',
      toast: true,
      position: 'center', 
    });

    if (!result.isConfirmed) return;

    try {
      await this.$store.dispatch("deleteComment", { postId, commentId });

      const comments = this.commentsMap[postId] || [];
      this.commentsMap = { ...this.commentsMap, [postId]: comments.filter(c => c.commentID !== commentId) };

      this.showTinyToast('Comment deleted!');
    } catch (error) {
      console.error("Error deleting comment:", error);
      this.showTinyToast('Failed to delete comment!', 'error');
    }
  },

async toggleCommentLike(postID, comment) {
  const token = VueCookies.get('token');

  try {
    const response = await axios.post(
      `http://localhost:2000/posts/comments/${comment.commentID}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Replace the comment object to trigger reactivity
    this.commentsMap[postID] = this.commentsMap[postID].map(c =>
      c.commentID === comment.commentID
        ? { ...c, liked: response.data.liked, likeCount: response.data.likeCount }
        : c
    );

  } catch (err) {
    console.error("Failed to toggle comment like:", err);
  }
},


  // Share Methods
// Open share popup
openSharePopup(postID) {
  this.showShareInputMap[postID] = true; 
  this.$nextTick(() => {
    const el = this.$el.querySelector(`div[data-post-id="${postID}"] .share-modal textarea`);
    if (el) el.focus();
  });
},

// Close share popup
closeSharePopup(postID) {
  this.showShareInputMap[postID] = false;
  this.shareInputMap[postID] = '';
},


}
};
</script>

<style scoped>
.edit-comment-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  margin-left: 8px;
  color: #007bff;
  font-size: 0.9em;
}
.edit-comment-btn:hover {
  color: #0056b3;
}

/* Layout & Container Styles */
.posts-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
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

.delete-post-btn {
  position: absolute;
  top: 15px;
  right: 50px; /* leave space from edit button */
  background: transparent;
  border: none;
  cursor: pointer;
  color: #b97b56;
  padding: 5px;
  border-radius: 4px;
  transition: color 0.2s;
}

.delete-post-btn:hover {
  color: #d9534f;
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

/* .fa-heart.liked {
  color: red;
  transform: scale(1.15);
} */

.liked {
  color: #dc3545;
}

/* Make the liked heart red, overriding fontawesome */
.post-actions i.fa-heart.liked {
  color: #dc3545;
  transform: scale(1.15);
  transition: all 0.2s;
}


.shared-from {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

.delete-btn {
  border: none;
  background: transparent;
  color: #b97b56;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
}

.delete-btn:hover {
  color: #d9534f;
}

.shared-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f7f7f7;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.shared-meta .delete-btn {
  font-size: 0.85em;
  color: #b97b56;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.shared-meta .delete-btn:hover {
  color: #d9534f;
}


/* Comments Section */
.comments-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
  font-size: 14px;
}

.comment-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  align-items: flex-end;
}

.comment-input textarea {
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

.comment-input textarea:focus {
  outline: none;
  border-color: #007bff;
}

.comment-like-btn {
  cursor: pointer;
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  pointer-events: all; /* ensure clicks register */
}

.fa-heart {
  transition: 0.2s ease;
}

.fa-heart.liked {
  color: red;
  transform: scale(1.15);
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

/* Modal Actions */
.modal-actions,
.share-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* Popup Notification */
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
}
</style>


<template>
  <div class="container">
    <div class="d-flex justify-content-center">
      <div class="col-md-6">
        <h2 v-if="isLogin">Login</h2>
        <h2 v-else>Sign up</h2>
        <transition name="flip" mode="out-in">
          <div class="card" v-if="isLogin" key="login-card">
            <form @submit.prevent="login">
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" v-model="loginForm.emailAdd" class="form-control" />
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" v-model="loginForm.userPass" class="form-control" />
              </div>
              <button type="submit" class="btn btn-primary">Login</button>
              <p v-if="loginError" class="text-danger">{{ loginError }}</p>
              <p v-if="isLogin" class="text-muted">
                Don't have an account yet? <a href="#" @click.prevent="isLogin = !isLogin">Sign Up!</a>
              </p>
            </form>
          </div>
          <div class="card" v-else key="signup-card">
            <form @submit.prevent="signup">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" v-model="signupForm.firstName" class="form-control" />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" v-model="signupForm.lastName" class="form-control" />
              </div>
              <div class="form-group">
                <label for="userAge">Age</label>
                <input type="number" id="userAge" v-model="signupForm.userAge" class="form-control" />
              </div>
              <div class="form-group">
                <label for="Gender">Gender</label>
                <select id="Gender" v-model="signupForm.Gender" class="form-control">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div class="form-group">
                <label for="userRole">Role</label>
                <select id="userRole" v-model="signupForm.userRole" class="form-control">
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div class="form-group">
                <label for="emailAdd">Email</label>
                <input type="email" id="emailAdd" v-model="signupForm.emailAdd" class="form-control" />
              </div>
              <div class="form-group">
                <label for="userPass">Password</label>
                <input type="password" id="userPass" v-model="signupForm.userPass" class="form-control" />
              </div>
              <div class="form-group">
                <label for="userProfile">Profile</label>
                <input type="text" id="userProfile" v-model="signupForm.userProfile" class="form-control" />
              </div>
              <button type="submit" class="btn btn-primary">Sign up</button>
              <p v-if="signupError" class="text-danger">{{ signupError }}</p>
              <p class="text-muted">
                Already have an account? <a href="#" @click.prevent="isLogin = !isLogin">Back to log in</a>
              </p>
            </form>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isLogin: true,
      loginForm: {
        emailAdd: '',
        userPass: ''
      },
      signupForm: {
        firstName: '',
        lastName: '',
        userAge: '',
        Gender: '',
        userRole: '',
        emailAdd: '',
        userPass: '',
        userProfile: ''
      },
      loginError: '',
      signupError: ''
    }
  },
  methods: {
    async login() {
      try {
        if (!this.loginForm.emailAdd || !this.loginForm.userPass) {
          this.loginError = 'Please enter both email and password';
          return;
        }
        if (!this.validateEmail(this.loginForm.emailAdd)) {
          this.loginError = 'Invalid email';
          return;
        }
        if (this.loginForm.userPass.length < 4) {
          this.loginError = 'Password must be at least 4 characters';
          return;
        }
        await this.$store.dispatch('loginUser', this.loginForm);
      } catch (error) {
        console.error(error);
        this.loginError = 'Invalid email or password';
      }
    },
    async signup() {
      try {
        await this.$store.dispatch('signupUser', this.signupForm)
      } catch (error) {
        if (error.message.includes('already exists')) {
          this.signupError = 'Email already exists'
        } else {
          this.signupError = 'An error occurred during signup'
        }
      }
    },
    validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },
  }
}
</script>

<style scoped>
.container {
  margin-top: 50px;
  margin-bottom: 30px;
}


.flip-enter-active {
  transform: rotateY(0deg);
  transition: transform 0.5s;
}

.flip-leave-active {
  transform: rotateY(90deg);
  transition: transform 0.5s;
}

.flip-enter {
  transform: rotateY(90deg);
}

.flip-leave-to {
  transform: rotateY(0deg);
}
.flip-enter-active, .flip-leave-active {
  transition: transform 0.5s;
}

.flip-enter {
  transform: rotateY(90deg);
}

.flip-leave-to {
  transform: rotateY(-90deg);
}
.card {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  backface-visibility: hidden; /* add this to prevent flickering */
  transform-style: preserve-3d;
  transition: transform 0.5s;
}

.row {
  justify-content: center;
}

.col-md-6 {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 10px;
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
}

button[type="submit"] {
  width: 100%;
  padding: 10px;
  background-color: rgb(148, 118, 103);;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

button[type="submit"]:hover {
  background-color: white;
  color: rgb(148, 118, 103);;
}

a{
  color: rgb(148, 118, 103) !important;
}

.text-danger {
  color: red;
  margin-top: 10px;
}
</style>
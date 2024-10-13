import { getPostsDb, getPostDb, insertPostDb, deletePostDb, updatePostDb, likePostDb } from '../model/postsDb.js'
import { getUsersDb } from '../model/usersDb.js'

const getPosts = async (req, res) => {
    res.json(await getPostsDb())
}

const getPost = async (req, res) => {
    const postId = req.params.id;
    const post = await getPostDb(postId);
    res.json(post);
};

const createPost = async (req, res) => {
    let { title, content, imageUrl, category, tags, likeCount } = req.body
    await insertPostDb(title, content, imageUrl, category, tags, likeCount)
    res.send('Post was created successfully')
}

const deletePost = async (req, res) => {
    await deletePostDb(req.params.id)
    res.send('Post has been deleted')
}

const updatePost = async(req,res)=>{
    let {title, content, imageUrl, category, tags, likeCount} = req.body
    let post = await getPostDb(req.params.id)
    title ? title=title : title = post.title
    content ? content=content : content = post.content
    imageUrl ? imageUrl=imageUrl : imageUrl = post.imageUrl
    category ? category=category : category = post.category
    tags ? tags=tags : tags = post.tags
    likeCount ? likeCount=likeCount : likeCount = post.likeCount
    await updatePostDb(req.params.id, title, content, imageUrl, category, tags, likeCount)
    res.send('Update was successful')
}

const likePost = async (req, res) => {
    let userID = req.body.userID;
    let postID = req.body.postID;
    if (!userID || !postID) {
      res.status(400).json({ error: 'userID and postID are required' });
      return;
    }
    try {
      await likePostDb(userID, postID);
      res.json({ message: "Successfully liked!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to like post' });
    }
}

export {getPosts, getPost, createPost, deletePost, updatePost, likePost}
import axios from 'axios';
import { toast } from 'react-toastify';
import cookie from 'js-cookie';
import baseUrl from './baseUrl';
import catchErrors from './catchErrors';

export const Axios = axios.create({
  baseURL: `${baseUrl}/post`,
  withCredentials: true,
});

const toastError = (error) => toast.error(catchErrors(error));

export const submitNewPost = async (newPost, picUrl) => {
  try {
    const { data } = await Axios.post('/', { ...newPost, picUrl });

    return { data };
  } catch (error) {
    throw catchErrors(error);
  }
};

export const deletePost = async (postId, setPosts) => {
  try {
    await Axios.delete(`/${postId}`);
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    toast.info('Post deleted successfully');
  } catch (error) {
    toastError(error);
  }
};

export const likePost = async (postId, userId, setLikes, like = true) => {
  try {
    if (like) {
      await Axios.patch(`/like/${postId}`);
      setLikes((prev) => [...prev, { id: userId }]);
    }
    //
    else if (!like) {
      await Axios.patch(`/unlike/${postId}`);
      setLikes((prev) => prev.filter((like) => like.id !== userId));
    }
  } catch (error) {
    toastError(error);
  }
};

export const postComment = async (postId, user, text, setComments, setText) => {
  try {
    const res = await Axios.post(`/comment/${postId}`, { text });

    const newComment = res.data;

    setComments((prev) => [newComment, ...prev]);
    setText('');
  } catch (error) {
    toastError(error);
  }
};

export const deleteComment = async (postId, commentId, setComments) => {
  try {
    await Axios.delete(`/comment/${postId}/${commentId}`);
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  } catch (error) {
    toastError(error);
  }
};

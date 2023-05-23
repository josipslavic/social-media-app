import axios from 'axios';
import baseUrl from './baseUrl';
import catchErrors from './catchErrors';

export const Axios = axios.create({
  baseURL: `${baseUrl}/user`,
  withCredentials: true,
});

export const followUser = async (userToFollowId, setUserFollowStats) => {
  try {
    await Axios.patch(`/follow/${userToFollowId}`);

    setUserFollowStats((prev) => ({
      ...prev,
      following: [...prev.following, { id: userToFollowId }],
    }));
  } catch (error) {
    alert(catchErrors(error));
  }
};

export const unfollowUser = async (userToUnfollowId, setUserFollowStats) => {
  try {
    await Axios.patch(`/unfollow/${userToUnfollowId}`);

    setUserFollowStats((prev) => ({
      ...prev,
      following: prev.following.filter(
        (following) => following.id !== userToUnfollowId
      ),
    }));
  } catch (error) {
    alert(catchErrors(error));
  }
};

export const profileUpdate = async (
  profile,
  profilePicUrl,
  setLoading,
  setError
) => {
  try {
    const { bio, facebook, youtube, twitter, instagram } = profile;

    await Axios.post(`/update`, {
      bio,
      facebook,
      youtube,
      twitter,
      instagram,
      profilePicUrl,
    });

    setLoading(false);
    window.location.reload();
  } catch (error) {
    setError(catchErrors(error));
    setLoading(false);
  }
};

export const passwordUpdate = async (setSuccess, userPasswords) => {
  const { currentPassword, newPassword } = userPasswords;
  try {
    await Axios.patch(`/settings/update-password`, {
      currentPassword,
      newPassword,
    });

    setSuccess(true);
  } catch (error) {
    alert(catchErrors(error));
  }
};

import React, { useState, useEffect } from 'react';
import { Button } from 'semantic-ui-react';
import Spinner from '../Layout/Spinner';
import { NoFollowData } from '../Layout/NoData';
import Avatar from '../Post/Avatar';
import { followUser, unfollowUser } from '../../utils/profileActions';
import axios from 'axios';
import baseUrl from '../../utils/baseUrl';
import cookie from 'js-cookie';

const Following = ({
  user,
  loggedUserFollowStats,
  setUserFollowStats,
  profileUserId,
}) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const getFollowing = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${baseUrl}/user/following/${profileUserId}`,
          {
            withCredentials: true,
          }
        );

        setFollowing(res.data);
      } catch (error) {
        alert('Error Loading Followers');
      }
      setLoading(false);
    };

    getFollowing();
  }, []);

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        following.map((profileFollowing) => {
          const isFollowing = loggedUserFollowStats.following?.some(
            (following) => following.id === profileFollowing.id
          );

          return (
            <div
              className='flex items-center relative'
              style={{ gap: '10px', marginBottom: '1.2rem' }}
            >
              <Avatar
                alt={profileFollowing.name}
                src={profileFollowing.profilePicUrl}
              />

              <a href={`/${profileFollowing.username}`}>
                {profileFollowing.name}
              </a>

              <div className='absolute' style={{ right: '10px' }}>
                {profileFollowing.id !== user.id && (
                  <Button
                    color={isFollowing ? 'instagram' : 'twitter'}
                    icon={isFollowing ? 'check' : 'add user'}
                    content={isFollowing ? 'Following' : 'Follow'}
                    disabled={followLoading}
                    onClick={() => {
                      setFollowLoading(true);

                      isFollowing
                        ? unfollowUser(profileFollowing.id, setUserFollowStats)
                        : followUser(profileFollowing.id, setUserFollowStats);

                      setFollowLoading(false);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })
      )}

      {following.length === 0 && <NoFollowData followingComponent={true} />}
    </>
  );
};

export default Following;

import React, { useState, useEffect } from 'react';
import { Button } from 'semantic-ui-react';
import Spinner from '../Layout/Spinner';
import { NoFollowData } from '../Layout/NoData';
import Avatar from '../Post/Avatar';
import { followUser, unfollowUser } from '../../utils/profileActions';
import axios from 'axios';
import baseUrl from '../../utils/baseUrl';
import cookie from 'js-cookie';

const Followers = ({
  user,
  loggedUserFollowStats,
  setUserFollowStats,
  profileUserId,
}) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const getFollowers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${baseUrl}/user/followers/${profileUserId}`,
          {
            withCredentials: true,
          }
        );

        setFollowers(res.data);
      } catch (error) {
        alert('Error Loading Followers');
      }
      setLoading(false);
    };

    getFollowers();
  }, []);

  return (
    <>
      {loading ? (
        <Spinner />
      ) : (
        followers.map((profileFollower) => {
          const isFollowing = loggedUserFollowStats.following?.some(
            (following) => following.id === profileFollower.id
          );

          return (
            <div
              className='flex items-center relative'
              style={{ gap: '10px', marginBottom: '1.2rem' }}
            >
              <Avatar
                alt={profileFollower.name}
                src={profileFollower.profilePicUrl}
              />

              <a href={`/${profileFollower.username}`}>
                {profileFollower.name}
              </a>

              <div className='absolute' style={{ right: '10px' }}>
                {profileFollower.id !== user.id && (
                  <Button
                    color={isFollowing ? 'instagram' : 'twitter'}
                    icon={isFollowing ? 'check' : 'add user'}
                    content={isFollowing ? 'Following' : 'Follow'}
                    disabled={followLoading}
                    onClick={() => {
                      setFollowLoading(true);

                      isFollowing
                        ? unfollowUser(profileFollower.id, setUserFollowStats)
                        : followUser(profileFollower.id, setUserFollowStats);

                      setFollowLoading(false);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })
      )}

      {followers.length === 0 && <NoFollowData followersComponent={true} />}
    </>
  );
};

export default Followers;

import React, { useState } from 'react';
import {
  Segment,
  Grid,
  Divider,
  Header,
  Button,
  List,
} from 'semantic-ui-react';
import Avatar from '../Post/Avatar';
import { followUser, unfollowUser } from '../../utils/profileActions';

function ProfileHeader({
  profile,
  ownAccount,
  loggedUserFollowStats,
  setUserFollowStats,
}) {
  const [loading, setLoading] = useState(false);

  const isFollowing = loggedUserFollowStats.following.some(
    (following) => following.id === profile.id
  );

  const hasSocials =
    profile.facebook || profile.twitter || profile.instagram || profile.youtube;

  return (
    <>
      <Segment>
        <Grid stackable>
          <Grid.Column width={11}>
            <Grid.Row>
              <Header
                as='h2'
                content={profile.name}
                style={{ marginBottom: '5px' }}
              />
            </Grid.Row>

            <Grid.Row stretched>
              {profile.bio}
              <Divider hidden />
            </Grid.Row>

            <Grid.Row>
              {hasSocials ? (
                <List>
                  <List.Item>
                    <List.Icon name='mail' />
                    <List.Content content={profile.email} />
                  </List.Item>

                  {profile.facebook && (
                    <List.Item>
                      <List.Icon name='facebook' color='blue' />
                      <List.Content
                        style={{ color: 'blue' }}
                        content={profile.facebook}
                      />
                    </List.Item>
                  )}

                  {profile.instagram && (
                    <List.Item>
                      <List.Icon name='instagram' color='red' />
                      <List.Content
                        style={{ color: 'blue' }}
                        content={profile.instagram}
                      />
                    </List.Item>
                  )}

                  {profile.youtube && (
                    <List.Item>
                      <List.Icon name='youtube' color='red' />
                      <List.Content
                        style={{ color: 'blue' }}
                        content={profile.youtube}
                      />
                    </List.Item>
                  )}

                  {profile.twitter && (
                    <List.Item>
                      <List.Icon name='twitter' color='blue' />
                      <List.Content
                        style={{ color: 'blue' }}
                        content={profile.twitter}
                      />
                    </List.Item>
                  )}
                </List>
              ) : (
                <>No Social Media Links </>
              )}
            </Grid.Row>
          </Grid.Column>

          <Grid.Column width={5} stretched style={{ textAlign: 'center' }}>
            <Grid.Row>
              <Avatar
                styles={{ height: '200px', width: '200px' }}
                alt={profile.name}
                src={profile.profilePicUrl}
              />
            </Grid.Row>
            <br />

            {!ownAccount && (
              <Button
                compact
                loading={loading}
                disabled={loading}
                content={isFollowing ? 'Following' : 'Follow'}
                icon={isFollowing ? 'check circle' : 'add user'}
                color={isFollowing ? 'instagram' : 'twitter'}
                onClick={async () => {
                  setLoading(true);
                  isFollowing
                    ? await unfollowUser(profile.id, setUserFollowStats)
                    : await followUser(profile.id, setUserFollowStats);
                  setLoading(false);
                }}
              />
            )}
          </Grid.Column>
        </Grid>
      </Segment>
    </>
  );
}

export default ProfileHeader;

import React, { useState, useRef } from 'react';
import { Form, Button, Message, Divider } from 'semantic-ui-react';
import ImageDropDiv from '../Common/ImageDropDiv';
import CommonInputs from '../Common/CommonInputs';
import { profileUpdate } from '../../utils/profileActions';
import catchErrors from '@/utils/catchErrors';
import axios from 'axios';
import baseUrl from '@/utils/baseUrl';

function UpdateProfile({ Profile }) {
  const [profile, setProfile] = useState({
    bio: Profile.bio || '',
    facebook: Profile?.facebook || '',
    youtube: Profile?.youtube || '',
    instagram: Profile?.instagram || '',
    twitter: Profile?.twitter || '',
  });

  const [errorMsg, setErrorMsg] = useState(null);

  const [loading, setLoading] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  const [highlighted, setHighlighted] = useState(false);
  const inputRef = useRef();
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'media') {
      setMedia(files[0]);
      setMediaPreview(URL.createObjectURL(files[0]));
    }
    if (name !== 'media') setProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Form
        error={errorMsg !== null}
        loading={loading}
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);

          const formData = new FormData();

          for (const [key, value] of Object.entries(profile)) {
            formData.append(key, value);
          }

          console.log(media);

          if (media) formData.append('file', media);

          try {
            await axios.patch(`${baseUrl}/user/update`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              withCredentials: true,
            });
            window.location.reload();
          } catch (error) {
            setErrorMsg(catchErrors(error));
            setLoading(false);
          }
        }}
      >
        <Message
          onDismiss={() => setErrorMsg(false)}
          error
          content={errorMsg}
          attached
          header='Oops!'
        />

        <ImageDropDiv
          inputRef={inputRef}
          highlighted={highlighted}
          setHighlighted={setHighlighted}
          handleChange={handleChange}
          mediaPreview={mediaPreview}
          setMediaPreview={setMediaPreview}
          setMedia={setMedia}
          profilePicUrl={Profile.profilePicUrl}
        />

        <CommonInputs
          user={profile}
          handleChange={handleChange}
          showSocialLinks={showSocialLinks}
          setShowSocialLinks={setShowSocialLinks}
        />

        <Divider hidden />

        <Button
          color='blue'
          icon='pencil alternate'
          disabled={profile.bio === '' || loading}
          content='Submit'
          type='submit'
        />
      </Form>
    </>
  );
}

export default UpdateProfile;

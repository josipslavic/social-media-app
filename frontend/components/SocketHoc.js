import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import baseUrl from '../utils/baseUrl';
import NotificationPortal from './Home/NotificationPortal';

function SocketHoc({ user, socket, children }) {
  const [newNotification, setNewNotification] = useState(null);
  const [notificationPopup, showNotificationPopup] = useState(false);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io(baseUrl);
    }

    if (socket.current) {
      socket.current.emit('join', { userId: user.id });

      socket.current.on(
        'newNotificationReceived',
        ({ name, profilePicUrl, username, postId }) => {
          setNewNotification({ name, profilePicUrl, username, postId });

          showNotificationPopup(true);
        }
      );
    }
  }, []);

  return (
    <>
      {notificationPopup && newNotification !== null && (
        <NotificationPortal
          newNotification={newNotification}
          notificationPopup={notificationPopup}
          showNotificationPopup={showNotificationPopup}
        />
      )}
      {children}
    </>
  );
}

export default SocketHoc;

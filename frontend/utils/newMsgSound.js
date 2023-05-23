const newMsgSound = (senderName) => {
  const sound = new Audio('/light.mp3');

  if (sound) sound.play().catch((err) => console.log(err));
};

export default newMsgSound;

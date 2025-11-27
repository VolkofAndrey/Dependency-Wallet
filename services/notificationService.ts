export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const scheduleNotification = (title: string, body: string, delayMs: number) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  // Примечание: В реальном PWA для надежной работы в фоне требуется Service Worker.
  // setTimeout работает только пока вкладка открыта или находится в памяти.
  setTimeout(() => {
    new Notification(title, {
      body,
      // В реальном проекте пути к иконкам должны быть валидными
      icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', 
    });
  }, delayMs);
};
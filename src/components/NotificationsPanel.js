import React, { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../utils/api';

const getStoredUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('foodshare_user') || '{}');
    return user.user_id || user.id || null;
  } catch (error) {
    return null;
  }
};

const normalizeNotification = (notification) => ({
  id: notification.notification_id || notification.id,
  message: notification.message || 'New notification',
  isRead: Number(notification.is_read) === 1,
  createdAt: notification.created_at || '',
});

const NotificationsPanel = ({ title = 'Notifications' }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadNotifications = async () => {
      const userId = getStoredUserId();

      if (!userId) {
        setErrorMessage('Login to view notifications.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getNotifications(userId);
        const rows = (response.data || []).map(normalizeNotification);
        setNotifications(rows);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load notifications.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update notification.');
    }
  };

  return (
    <div className="card mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>

      {isLoading && <div className="text-gray-600">Loading notifications...</div>}
      {errorMessage && !isLoading && (
        <div className="text-sm text-red-600 mb-3">{errorMessage}</div>
      )}

      {!isLoading && !errorMessage && notifications.length === 0 && (
        <div className="text-gray-600">No notifications yet.</div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 ${
              notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-primary-200'
            }`}
          >
            <div>
              <p className="text-sm text-gray-900">{notification.message}</p>
              {notification.createdAt && (
                <p className="text-xs text-gray-500 mt-1">{notification.createdAt}</p>
              )}
            </div>
            {!notification.isRead && (
              <button
                type="button"
                onClick={() => handleMarkRead(notification.id)}
                className="text-xs text-primary-600 font-semibold hover:text-primary-700"
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPanel;

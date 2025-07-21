import React from 'react';
import { IUser } from '@/app/models/User';
import Link from 'next/link';
import { FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaBuilding } from 'react-icons/fa';
import '@/app/styles/user-item.css';

interface UserItemProps {
  user: IUser;
  currentUserId: string;
  onToggleStatus: (userId: string, newStatus: boolean) => void;
  onDelete: (userId: string) => void;
  isLoading: boolean;
}

const UserItem: React.FC<UserItemProps> = ({
  user,
  currentUserId,
  onToggleStatus,
  onDelete,
  isLoading
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'admin';
      case 'MANAGER':
        return 'manager';
      default:
        return 'basic';
    }
  };

  // Handle optional organizationCode property
  const organizationCode = 'organizationCode' in user && user.organizationCode ? 
    String(user.organizationCode) : '';

  return (
    <tr>
      <td>
        <div className="user-name-cell">
          <div className="user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
          </div>
        </div>
      </td>
      <td>{user.email}</td>
      <td>
        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
          {user.role === 'ADMIN' ? 'Admin' : user.role === 'MANAGER' ? 'Manager' : 'Basic'}
        </span>
      </td>
      <td>
        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
          {user.isActive ? (
            <>
              <span className="status-badge-icon">●</span> Active
            </>
          ) : (
            <>
              <span className="status-badge-icon">●</span> Inactive
            </>
          )}
        </span>
      </td>
      <td>
        {organizationCode ? (
          <div className="user-org-code-container">
            <FaBuilding className="org-code-icon" />
            <code className="org-code">{organizationCode}</code>
          </div>
        ) : (
          <span className="no-org-code">No code</span>
        )}
      </td>
      <td className="actions-cell">
        <Link href={`/dashboard/users/${user._id}`} passHref>
          <button className="action-button view-button" title="View user">
            <FaEye />
          </button>
        </Link>
        
        <Link href={`/dashboard/users/${user._id}/edit`} passHref>
          <button className="action-button edit-button" title="Edit user">
            <FaEdit />
          </button>
        </Link>
        
        {currentUserId !== user._id && (
          <>
            <button
              className={`action-button toggle-button ${user.isActive ? 'active' : 'inactive'}`}
              onClick={() => onToggleStatus(user._id!, !user.isActive)}
              disabled={isLoading}
              title={user.isActive ? "Deactivate user" : "Activate user"}
            >
              {user.isActive ? <FaToggleOn /> : <FaToggleOff />}
            </button>
            
            <button
              className="action-button delete-button"
              onClick={() => onDelete(user._id!)}
              disabled={isLoading}
              title="Delete user"
            >
              <FaTrash />
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

export default UserItem; 
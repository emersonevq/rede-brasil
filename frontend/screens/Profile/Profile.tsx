import React from 'react';
import UserProfileView from '../../components/UserProfileView';
import { profileData } from './Data';

export default function ProfileScreen() {
  return <UserProfileView profile={profileData} editable />;
}

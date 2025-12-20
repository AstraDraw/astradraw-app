import React, { useState, useEffect, useRef } from "react";
import { t } from "@excalidraw/excalidraw/i18n";
import { useAuth } from "../../auth";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  deleteAvatar,
  type UserProfile,
} from "../../auth/workspaceApi";
import "./UserProfileDialog.scss";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Stop keyboard events from propagating to Excalidraw canvas
const stopPropagation = (e: React.KeyboardEvent) => {
  e.stopPropagation();
};

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
    }
  }, [profile]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserProfile({
        name: name.trim() || undefined,
      });
      setProfile(updated);
      setIsEditingName(false);
      showSuccess("Name updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      showSuccess("Avatar updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
    } finally {
      setIsSaving(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.avatarUrl) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await deleteAvatar();
      setProfile(updated);
      showSuccess("Avatar removed");
    } catch (err: any) {
      setError(err.message || "Failed to remove avatar");
    } finally {
      setIsSaving(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="user-profile-dialog__overlay" onClick={onClose}>
      <div className="user-profile-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="user-profile-dialog__header">
          <h2>{t("workspace.myProfile") || "My Profile"}</h2>
          <button
            className="user-profile-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="user-profile-dialog__content">
          {isLoading ? (
            <div className="user-profile-dialog__loading">
              <div className="user-profile-dialog__spinner" />
            </div>
          ) : error && !profile ? (
            <div className="user-profile-dialog__error">
              <p>{error}</p>
              <button onClick={loadProfile}>Retry</button>
            </div>
          ) : profile ? (
            <>
              {/* Success/Error messages */}
              {successMessage && (
                <div className="user-profile-dialog__success">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="user-profile-dialog__error-inline">{error}</div>
              )}

              {/* Avatar Section */}
              <div className="user-profile-dialog__section">
                <h3>{t("workspace.profilePicture") || "Profile Picture"}</h3>
                <div className="user-profile-dialog__avatar-section">
                  <div
                    className="user-profile-dialog__avatar"
                    onClick={handleAvatarClick}
                  >
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" />
                    ) : (
                      <div className="user-profile-dialog__avatar-initials">
                        {getInitials(profile.name, profile.email)}
                      </div>
                    )}
                    <div className="user-profile-dialog__avatar-overlay">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                  <div className="user-profile-dialog__avatar-actions">
                    <button
                      className="user-profile-dialog__button user-profile-dialog__button--secondary"
                      onClick={handleAvatarClick}
                      disabled={isSaving}
                    >
                      {t("workspace.changePhoto") || "Change Photo"}
                    </button>
                    {profile.avatarUrl && (
                      <button
                        className="user-profile-dialog__button user-profile-dialog__button--danger"
                        onClick={handleDeleteAvatar}
                        disabled={isSaving}
                      >
                        {t("workspace.removePhoto") || "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Section */}
              <div className="user-profile-dialog__section">
                <h3>{t("workspace.profileName") || "Profile Name"}</h3>
                {isEditingName ? (
                  <div className="user-profile-dialog__edit-field">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={stopPropagation}
                      onKeyUp={stopPropagation}
                      placeholder={
                        t("workspace.namePlaceholder") || "Your name"
                      }
                      autoFocus
                    />
                    <div className="user-profile-dialog__edit-actions">
                      <button
                        className="user-profile-dialog__button user-profile-dialog__button--primary"
                        onClick={handleSaveName}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="user-profile-dialog__button user-profile-dialog__button--secondary"
                        onClick={() => {
                          setIsEditingName(false);
                          setName(profile.name || "");
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="user-profile-dialog__field">
                    <span>{profile.name || "Not set"}</span>
                    <button
                      className="user-profile-dialog__edit-button"
                      onClick={() => setIsEditingName(true)}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Email Section (read-only) */}
              <div className="user-profile-dialog__section">
                <h3>{t("workspace.email") || "Email"}</h3>
                <div className="user-profile-dialog__field user-profile-dialog__field--readonly">
                  <span>{profile.email}</span>
                </div>
              </div>

              {/* Sign Out Section */}
              <div className="user-profile-dialog__section user-profile-dialog__section--actions">
                <button
                  className="user-profile-dialog__button user-profile-dialog__button--danger-outline"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  {t("workspace.logout") || "Sign out"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserProfileDialog;

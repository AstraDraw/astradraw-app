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

import "./ProfilePage.scss";

// Stop keyboard events from propagating to Excalidraw canvas
const stopPropagation = (e: React.KeyboardEvent) => {
  e.stopPropagation();
};

// Icons
const personIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const emailIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const shieldIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const editIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const logoutIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

interface ProfilePageProps {}

export const ProfilePage: React.FC<ProfilePageProps> = () => {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

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
    if (!profile) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserProfile({
        name: name.trim() || undefined,
      });
      setProfile(updated);
      setIsEditingName(false);
      // Refresh the global auth user state so sidebar updates
      await refreshUser();
      showSuccess(t("settings.nameUpdated"));
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
    if (!file) {
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError(t("settings.imageTooLarge"));
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      // Refresh the global auth user state so sidebar updates
      await refreshUser();
      showSuccess(t("settings.avatarUpdated"));
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
    if (!profile?.avatarUrl) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await deleteAvatar();
      setProfile(updated);
      // Refresh the global auth user state so sidebar updates
      await refreshUser();
      showSuccess(t("settings.avatarRemoved"));
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

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-page__loading">
          <div className="profile-page__spinner" />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <div className="profile-page__error">
          <p>{error}</p>
          <button onClick={loadProfile}>{t("settings.retry")}</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <h1 className="profile-page__title">{t("settings.myProfile")}</h1>

        {/* Separator after title */}
        <div className="profile-page__separator" />

        {/* Success/Error messages */}
        {successMessage && (
          <div className="profile-page__success">{successMessage}</div>
        )}
        {error && <div className="profile-page__error-inline">{error}</div>}

        {/* Profile Picture Section */}
        <section className="profile-page__row">
          <div className="profile-page__row-label">
            <h2>{t("settings.profilePicture")}</h2>
            <p>{t("settings.uploadProfilePicture")}</p>
          </div>
          <div className="profile-page__row-content profile-page__row-content--avatar">
            <div
              className="profile-page__avatar"
              onClick={handleAvatarClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleAvatarClick();
                }
              }}
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" />
              ) : (
                <div className="profile-page__avatar-initials">
                  {getInitials(profile.name, profile.email)}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <div className="profile-page__avatar-links">
              <button
                className="profile-page__link"
                onClick={handleAvatarClick}
                disabled={isSaving}
              >
                {t("settings.edit")}
              </button>
              {profile.avatarUrl && (
                <>
                  <span className="profile-page__link-separator">·</span>
                  <button
                    className="profile-page__link profile-page__link--danger"
                    onClick={handleDeleteAvatar}
                    disabled={isSaving}
                  >
                    {t("settings.removePhoto")}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Profile Name Section */}
        <section className="profile-page__row">
          <div className="profile-page__row-label">
            <h2>{t("settings.profileName")}</h2>
            <p>{t("settings.changeProfileName")}</p>
          </div>
          <div className="profile-page__row-content">
            {isEditingName ? (
              <div className="profile-page__edit-field">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    stopPropagation(e);
                    if (e.key === "Enter") {
                      handleSaveName();
                    } else if (e.key === "Escape") {
                      setIsEditingName(false);
                      setName(profile.name || "");
                    }
                  }}
                  onKeyUp={stopPropagation}
                  placeholder={t("settings.namePlaceholder")}
                  autoFocus
                  className="profile-page__input"
                />
                <div className="profile-page__edit-actions">
                  <button
                    className="profile-page__button profile-page__button--primary"
                    onClick={handleSaveName}
                    disabled={isSaving}
                  >
                    {isSaving ? t("settings.saving") : t("settings.save")}
                  </button>
                  <button
                    className="profile-page__button profile-page__button--secondary"
                    onClick={() => {
                      setIsEditingName(false);
                      setName(profile.name || "");
                    }}
                    disabled={isSaving}
                  >
                    {t("settings.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-page__field-card">
                <span className="profile-page__field-icon">{personIcon}</span>
                <span className="profile-page__field-value">
                  {profile.name || t("settings.notSet")}
                </span>
                <button
                  className="profile-page__edit-button"
                  onClick={() => setIsEditingName(true)}
                  title={t("settings.edit")}
                >
                  {editIcon}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Email Section */}
        <section className="profile-page__row">
          <div className="profile-page__row-label">
            <h2>{t("settings.accountEmail")}</h2>
            <p>{t("settings.accountEmailDescription")}</p>
          </div>
          <div className="profile-page__row-content">
            <div className="profile-page__field-info">
              <span className="profile-page__field-icon">{emailIcon}</span>
              <span className="profile-page__field-value">{profile.email}</span>
            </div>
          </div>
        </section>

        {/* Role Section */}
        <section className="profile-page__row">
          <div className="profile-page__row-label">
            <h2>{t("settings.role")}</h2>
            <p>{t("settings.roleDescription")}</p>
          </div>
          <div className="profile-page__row-content">
            <div className="profile-page__field-info">
              <span className="profile-page__field-icon">{shieldIcon}</span>
              {profile.isSuperAdmin ? (
                <span className="profile-page__role-badge profile-page__role-badge--admin">
                  {t("settings.roleSuperAdmin")}
                </span>
              ) : (
                <span className="profile-page__role-badge">
                  {t("settings.roleUser")}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Sign Out Section */}
        <section className="profile-page__row">
          <div className="profile-page__row-label">
            <h2>{t("settings.signOut")}</h2>
            <p>{t("settings.signOutDescription")}</p>
          </div>
          <div className="profile-page__row-content">
            <button
              className="profile-page__button profile-page__button--primary"
              onClick={logout}
            >
              {logoutIcon}
              {t("settings.signOutButton")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;

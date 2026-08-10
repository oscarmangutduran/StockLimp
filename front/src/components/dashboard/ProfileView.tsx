import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ModalAlert from '@/components/common/ModalAlert';
import { styles } from '../../css/ProfileView.styles';

interface UserData {
  id_user: number;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  foto_perfil?: string;
  rol: string;
  id_centro?: number | null;
}

interface ProfileViewProps {
  baseUrl: string;
  user: UserData;
  onUpdateUser: (userData: any) => void;
}

export default function ProfileView({ baseUrl, user, onUpdateUser }: ProfileViewProps) {
  const [nombre, setNombre] = useState(user.nombre || '');
  const [apellido, setApellido] = useState(user.apellido || '');
  const [email, setEmail] = useState(user.email || '');
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [direccion, setDireccion] = useState(user.direccion || '');
  const [fotoPerfil, setFotoPerfil] = useState(user.foto_perfil || '');
  const [newPhotoBase64, setNewPhotoBase64] = useState<string | null>(null);
  const [photoCleared, setPhotoCleared] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<any>(null);

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title?: string; message: string; showCancel?: boolean; onConfirm?: () => void }>({ visible: false, message: '' });
  const showAlert = (message: string, title = 'Aviso') => setAlertConfig({ visible: true, title, message, showCancel: false, onConfirm: undefined });

  const handleChooseImage = () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      showAlert('La selección de fotos está disponible en la versión Web.');
    }
  };

  const handleFileChange = (e: any) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setNewPhotoBase64(reader.result as string);
        setPhotoCleared(false);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearPhoto = () => {
    setNewPhotoBase64(null);
    setFotoPerfil('');
    setPhotoCleared(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      setError('El nombre es requerido.');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es requerido.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        id_user: user.id_user,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      };

      if (newPhotoBase64) {
        payload.foto_perfil_base64 = newPhotoBase64;
      }

      if (photoCleared) {
        payload.foto_perfil_clear = true;
      }

      const response = await fetch(`${baseUrl}/usuarios/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('¡Perfil actualizado con éxito!');
        setNewPhotoBase64(null);
        setPhotoCleared(false);
        if (data.user) {
          setFotoPerfil(data.user.foto_perfil || '');
          onUpdateUser(data.user);
        }
      } else {
        setError(data.message || 'Error al guardar los cambios del perfil.');
      }
    } catch (e) {
      console.error('Error updating profile:', e);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Get image URI source for rendering
  const getAvatarSource = () => {
    if (newPhotoBase64) {
      return { uri: newPhotoBase64 };
    }
    if (fotoPerfil) {
      return {
        uri: fotoPerfil.startsWith('http') ? fotoPerfil : `${baseUrl.replace('/api', '')}${fotoPerfil}`,
      };
    }
    return null;
  };

  const avatarSource = getAvatarSource();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.viewTitle}>MI PERFIL</Text>
        <Text style={styles.viewSub}>Actualiza tu información personal y foto de perfil</Text>
      </View>

      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />
      )}

      <View style={styles.mainLayout}>
        {/* Left Column: Avatar & Photo Actions */}
        <View style={styles.photoCard}>
          <Text style={styles.cardTitle}>Foto de Perfil</Text>
          <View style={styles.avatarWrapper}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={60} color="#94A3B8" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraIconBadge} onPress={handleChooseImage}>
              <Feather name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoTip}>Formatos: JPG, PNG o WEBP. Máx: 5MB</Text>
          
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={handleChooseImage}>
              <Feather name="upload" size={14} color="#5C8E8D" />
              <Text style={styles.uploadBtnText}>Subir Foto</Text>
            </TouchableOpacity>

            {(avatarSource !== null) && (
              <TouchableOpacity style={styles.deletePhotoBtn} onPress={handleClearPhoto}>
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.deletePhotoBtnText}>Quitar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Right Column: Form Inputs */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Datos Personales</Text>

          {error && (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successAlert}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={styles.successAlertText}>{success}</Text>
            </View>
          )}

          <View style={styles.formGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={(text) => { setNombre(text); setError(null); }}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={apellido}
                onChangeText={(text) => { setApellido(text); setError(null); }}
                placeholder="Ingresa tu apellido"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                onChangeText={(text) => { setEmail(text); setError(null); }}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Email can be disabled or editable depending on admin policy. Usually email is read-only.
              />
              <Text style={styles.inputHelp}>El correo electrónico es gestionado por administración.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono de Contacto</Text>
              <TextInput
                style={styles.input}
                value={telefono}
                onChangeText={(text) => { setTelefono(text); setError(null); }}
                placeholder="Ej. +34 600 000 000"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, { gridColumn: 'span 2' } as any]}>
              <Text style={styles.label}>Dirección Física</Text>
              <TextInput
                style={[styles.input, { height: 75, textAlignVertical: 'top', paddingTop: 10 }]}
                value={direccion}
                onChangeText={(text) => { setDireccion(text); setError(null); }}
                placeholder="Calle, Número, Piso, Ciudad, Código Postal"
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={2}
              />
            </View>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ModalAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}



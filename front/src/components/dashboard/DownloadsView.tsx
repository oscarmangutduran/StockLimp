import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../css/DownloadsView.styles';

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: 'Manuales' | 'Formularios' | 'Seguridad' | 'Corporativo' | 'Técnico';
  filename: string;
  fileSize: string;
  fileType: 'PDF' | 'HTML' | 'XLS';
  icon: keyof typeof Feather.glyphMap;
  roles?: string[]; // If undefined, available to all
  featured?: boolean;
}

const DOCUMENTS_LIST: DocumentItem[] = [
  {
    id: 'dossier-behance',
    title: 'Dossier Oficial StockLimp (Portfolio Behance 2026)',
    description: 'Presentación corporativa de la plataforma, diseño, catálogo oficial de productos y especificaciones.',
    category: 'Corporativo',
    filename: 'BEHANCE_PORTFOLIO_STOCKLIMP.pdf',
    fileSize: '635 KB',
    fileType: 'PDF',
    icon: 'briefcase',
    featured: true,
  },
  {
    id: 'manual-usuario',
    title: 'Manual de Usuario y Control Horario',
    description: 'Guía práctica para operarios: fichaje con código de centro, pausas con justificante y solicitud de vacaciones.',
    category: 'Manuales',
    filename: 'Manual_Usuario_StockLimp.pdf',
    fileSize: '1.2 MB',
    fileType: 'PDF',
    icon: 'book-open',
  },
  {
    id: 'solicitud-vacaciones',
    title: 'Plantilla Oficial de Solicitud de Vacaciones',
    description: 'Formulario normalizado de petición y registro de vacaciones y días de descanso según convenio laboral.',
    category: 'Formularios',
    filename: 'Plantilla_Solicitud_Vacaciones.pdf',
    fileSize: '450 KB',
    fileType: 'PDF',
    icon: 'calendar',
  },
  {
    id: 'seguridad-quimicos',
    title: 'Ficha de Prevención y Seguridad de Químicos (MSDS)',
    description: 'Instrucciones obligatorias de seguridad, equipos de protección (EPIs), dilución y manejo de productos de limpieza.',
    category: 'Seguridad',
    filename: 'Ficha_Seguridad_Quimicos_EPI.pdf',
    fileSize: '820 KB',
    fileType: 'PDF',
    icon: 'shield',
  },
  {
    id: 'portfolio-html',
    title: 'Dossier Interactivo Web StockLimp',
    description: 'Versión interactiva web a pantalla completa del portfolio de la aplicación con catálogo visual.',
    category: 'Corporativo',
    filename: 'BEHANCE_PORTFOLIO_STOCKLIMP.html',
    fileSize: '47 KB',
    fileType: 'HTML',
    icon: 'layout',
  },
  {
    id: 'cuadrante-caceres',
    title: 'Cuadrante y Censo de Trabajadores Cáceres',
    description: 'Hoja de asignación de centros, operarios y turnos de trabajo.',
    category: 'Formularios',
    filename: 'trabajadores caceres.xls',
    fileSize: '105 KB',
    fileType: 'XLS',
    icon: 'file-text',
    roles: ['admin', 'super_admin'],
  },
  {
    id: 'arquitectura-tecnica',
    title: 'Arquitectura Técnica del Sistema StockLimp',
    description: 'Documentación técnica completa: arquitectura Laravel 11, base de datos MySQL y frontend React Native / Expo.',
    category: 'Técnico',
    filename: 'ARCHITECTURE.pdf',
    fileSize: '418 KB',
    fileType: 'PDF',
    icon: 'server',
    roles: ['admin', 'super_admin'],
  },
];

interface DownloadsViewProps {
  baseUrl: string;
  userRole?: string;
}

export default function DownloadsView({ baseUrl, userRole = 'operario' }: DownloadsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['Todos', 'Corporativo', 'Manuales', 'Formularios', 'Seguridad', 'Técnico'];

  // Filter documents by role, category, and search query
  const filteredDocuments = DOCUMENTS_LIST.filter((doc) => {
    // Role check
    if (doc.roles && !doc.roles.includes(userRole)) {
      return false;
    }
    // Category check
    if (selectedCategory !== 'Todos' && doc.category !== selectedCategory) {
      return false;
    }
    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchDesc = doc.description.toLowerCase().includes(q);
      const matchCat = doc.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) {
        return false;
      }
    }
    return true;
  });

  const featuredDoc = DOCUMENTS_LIST.find((doc) => doc.featured);

  const getDownloadUrl = (filename: string) => {
    // If running in web, direct relative path to public downloads works nicely
    if (Platform.OS === 'web') {
      return `/downloads/${filename}`;
    }
    return `${baseUrl.replace('/api', '')}/downloads/${filename}`;
  };

  const handleDownload = (doc: DocumentItem) => {
    const url = getDownloadUrl(doc.filename);
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      Linking.openURL(url);
    }
  };

  const handlePreview = (doc: DocumentItem) => {
    const url = getDownloadUrl(doc.filename);
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.titleCol}>
          <View style={styles.viewTitleRow}>
            <View style={styles.titleIconBg}>
              <Feather name="arrow-down" size={22} color="#0F766E" />
            </View>
            <View>
              <Text style={styles.viewTitle}>Descargas</Text>
              <Text style={styles.viewSub}>
                Centro oficial de documentación, manuales de usuario, plantillas de RRHH y recursos.
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar documento..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Featured Banner (Dossier Behance) */}
      {featuredDoc && !searchQuery && selectedCategory === 'Todos' && (
        <View style={styles.featuredCard}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Documento Destacado</Text>
          </View>
          <Text style={styles.featuredTitle}>{featuredDoc.title}</Text>
          <Text style={styles.featuredDesc}>{featuredDoc.description}</Text>
          <View style={styles.featuredActions}>
            <TouchableOpacity
              style={styles.featuredBtnPrimary}
              onPress={() => handleDownload(featuredDoc)}
            >
              <Feather name="arrow-down" size={16} color="#FFFFFF" />
              <Text style={styles.featuredBtnPrimaryText}>Descargar PDF ({featuredDoc.fileSize})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featuredBtnSecondary}
              onPress={() => handlePreview(featuredDoc)}
            >
              <Feather name="external-link" size={15} color="#FFFFFF" />
              <Text style={styles.featuredBtnSecondaryText}>Visualizar Online</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Categories Filter */}
      <View style={styles.categoriesContainer}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Documents Grid */}
      <View style={styles.grid}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="folder" size={36} color="#CBD5E1" />
            <Text style={styles.emptyStateText}>No se encontraron documentos con estos filtros.</Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <View>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconBg}>
                    <Feather name={doc.icon} size={20} color="#0F766E" />
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardTag}>{doc.category}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {doc.title}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDesc} numberOfLines={3}>
                  {doc.description}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardSizeBadge}>
                  {doc.fileType} • {doc.fileSize}
                </Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.previewBtn}
                    onPress={() => handlePreview(doc)}
                    accessibilityLabel="Previsualizar"
                  >
                    <Feather name="eye" size={15} color="#475569" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(doc)}
                  >
                    <Feather name="arrow-down" size={14} color="#FFFFFF" />
                    <Text style={styles.downloadBtnText}>Descargar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}


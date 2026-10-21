import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../../css/OrdersView.styles';

interface PeriodNoticeBannerProps {
  isPeriodActive: boolean;
  simulateActivePeriod: boolean;
  onToggleSimulate: () => void;
}

export const PeriodNoticeBanner: React.FC<PeriodNoticeBannerProps> = ({
  isPeriodActive,
  simulateActivePeriod,
  onToggleSimulate,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 280 }}>
        <Feather name="info" size={18} color="#2563EB" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, color: '#1E3A8A', lineHeight: 20 }}>
          Nota: Puedes modificar tus pedidos del día 2 al 8 de cada mes. Estado actual:{' '}
          <Text style={{ fontWeight: 'bold', color: '#1D4ED8' }}>
            {isPeriodActive ? 'HABILITADO' : 'DESHABILITADO'}
          </Text>
          .
        </Text>
      </View>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        activeOpacity={0.8}
        onPress={onToggleSimulate}
      >
        <View style={[styles.checkbox, simulateActivePeriod && styles.checkboxChecked, { borderColor: '#2563EB', width: 16, height: 16 }]}>
          {simulateActivePeriod && <View style={[styles.checkboxInner, { backgroundColor: '#FFFFFF', width: 8, height: 8 }]} />}
        </View>
        <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: '500' }}>
          Simular periodo activo (para pruebas)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

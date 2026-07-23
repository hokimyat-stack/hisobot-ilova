// src/screens/HomeScreen.js — Bosh sahifa v3: yangi ish, davom etayotgan ishlar, parol
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navbatOl, navbatniYubor } from '../queue';
import { menikiOl } from '../api';
import { RANG, ILOVA_VERSIYA, GITHUB_RELEASES } from '../config';

export default function HomeScreen({ navigation }) {
  const [xodim, setXodim] = useState(null);
  const [navbatSoni, setNavbatSoni] = useState(0);
  const [yangilanish, setYangilanish] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [davomEtayotgan, setDavomEtayotgan] = useState([]);
  const [kutish, setKutish] = useState(true);

  const yangila = useCallback(async () => {
    const xRaw = await AsyncStorage.getItem('XODIM');
    if (!xRaw) return;
    const x = JSON.parse(xRaw);
    setXodim(x);
    setNavbatSoni((await navbatOl()).length);
    try {
      const res = await menikiOl(x.id);
      if (res.ok) {
        // Bosqichi tugallanmagan hisobotlar — "davom etayotgan"
        setDavomEtayotgan(res.hisobotlar.filter(h => h.bosqich !== 'YAKUNLANDI'));
      }
    } catch (e) {}
    setKutish(false);
  }, []);

  useFocusEffect(useCallback(() => { yangila(); }, [yangila]));

  useEffect(() => {
    fetch(GITHUB_RELEASES).then(r => r.json()).then(rel => {
      const v = (rel.tag_name || '').replace('v', '');
      if (v && v !== ILOVA_VERSIYA) setYangilanish({ v, url: rel.html_url });
    }).catch(() => {});
  }, []);

  async function navbatYuborQolda() {
    const res = await navbatniYubor();
    setNavbatSoni(res.qoldi);
    Alert.alert('Sinxronizatsiya',
      res.yuborildi + " ta hisobot yuborildi." + (res.qoldi ? ' ' + res.qoldi + " ta navbatda." : " Navbat bo'sh."));
  }

  function chiqish() {
    Alert.alert('Chiqish', 'Hisobdan chiqmoqchimisiz?', [
      { text: 'Bekor' },
      { text: 'Chiqish', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('XODIM');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  }

  const bugun = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', weekday: 'long' });
  const BOSQICH_NOMI = { BOSHLANDI: 'Boshlandi — davom bosqichi kerak', DAVOM_ETMOQDA: 'Davom etmoqda — yakun kerak' };

  return (
    <ScrollView style={s.wrap} refreshControl={<RefreshControl refreshing={refresh} onRefresh={async () => { setRefresh(true); await yangila(); setRefresh(false); }} />}>
      <View style={s.header}>
        <View>
          <Text style={s.salom}>Assalomu alaykum,</Text>
          <Text style={s.fio}>{xodim?.fio || ''}</Text>
          <Text style={s.bolim}>{bugun}</Text>
        </View>
        <TouchableOpacity onPress={chiqish}><Text style={s.chiqish}>Chiqish</Text></TouchableOpacity>
      </View>

      {yangilanish && (
        <View style={s.yangiBanner}>
          <Text style={s.yangiText}>Yangi versiya mavjud: v{yangilanish.v} — GitHub'dan yuklab oling</Text>
        </View>
      )}

      {navbatSoni > 0 && (
        <TouchableOpacity style={s.navbatCard} onPress={navbatYuborQolda}>
          <Text style={s.navbatSon}>{navbatSoni}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.navbatTitle}>ta hisobot navbatda (offline)</Text>
            <Text style={s.navbatSub}>Internet borligida bosing — hoziroq yuboriladi</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.asosiyBtn} onPress={() => navigation.navigate('NewReport')}>
        <Text style={s.asosiyPlus}>＋</Text>
        <Text style={s.asosiyText}>YANGI ISH BOSHLASH</Text>
        <Text style={s.asosiySub}>1-bosqich: boshlandi</Text>
      </TouchableOpacity>

      {kutish ? <ActivityIndicator style={{ marginTop: 10 }} color={RANG.asosiy} /> : (
        davomEtayotgan.length > 0 && (
          <View style={s.davomWrap}>
            <Text style={s.davomSarlavha}>Davom etayotgan ishlaringiz ({davomEtayotgan.length})</Text>
            {davomEtayotgan.map(h => (
              <TouchableOpacity key={h.id} style={s.davomCard}
                onPress={() => navigation.navigate('Stage', { hisobot: h })}>
                <View style={{ flex: 1 }}>
                  <Text style={s.davomIsh} numberOfLines={1}>{h.ishNomi || h.ishTuri}</Text>
                  <Text style={s.davomBosqich}>{BOSQICH_NOMI[h.bosqich]}</Text>
                </View>
                <Text style={s.davomOq}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      )}

      <TouchableOpacity style={s.ikkinchiBtn} onPress={() => navigation.navigate('MyReports')}>
        <Text style={s.ikkinchiText}>Mening hisobotlarim</Text>
        <Text style={s.ikkinchiSub}>Tarix, statuslar va oylik statistika</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.ikkinchiBtn} onPress={() => navigation.navigate('PasswordChange')}>
        <Text style={s.ikkinchiText}>Parolni almashtirish</Text>
        <Text style={s.ikkinchiSub}>Xavfsizlik uchun tavsiya etiladi</Text>
      </TouchableOpacity>

      <View style={s.info}>
        <Text style={s.infoTitle}>Eslatmalar</Text>
        <Text style={s.infoRow}>• Har ish 3 bosqichda yuklanadi: boshlandi → davom etmoqda → yakunlandi</Text>
        <Text style={s.infoRow}>• Rasmlar faqat kameradan olinadi</Text>
        <Text style={s.infoRow}>• Rad etilgan hisobotga bildirishnoma keladi, sababi ko'rsatiladi</Text>
        <Text style={s.infoRow}>• Belgilangan vaqtda keyingi bosqich uchun eslatma keladi</Text>
      </View>

      <Text style={s.versiya}>SysOne · Kunlik Hisobot v{ILOVA_VERSIYA}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: RANG.fon },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 54, backgroundColor: RANG.oq, borderBottomWidth: 1, borderColor: RANG.chiziq },
  salom: { color: RANG.kul, fontSize: 13 },
  fio: { fontSize: 20, fontWeight: '800', color: RANG.toq, marginTop: 2 },
  bolim: { color: RANG.kul, fontSize: 12.5, marginTop: 2 },
  chiqish: { color: RANG.qizil, fontWeight: '600', fontSize: 13, paddingTop: 6 },
  yangiBanner: { backgroundColor: '#FFF6E5', margin: 16, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F1D48A' },
  yangiText: { color: '#8A6200', fontSize: 13, fontWeight: '600' },
  navbatCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF1EF', margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3C1BB' },
  navbatSon: { fontSize: 30, fontWeight: '800', color: RANG.qizil },
  navbatTitle: { fontWeight: '700', color: RANG.toq },
  navbatSub: { color: RANG.kul, fontSize: 12, marginTop: 2 },
  asosiyBtn: { backgroundColor: RANG.asosiy, margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', elevation: 4 },
  asosiyPlus: { fontSize: 36, color: '#fff', lineHeight: 40 },
  asosiyText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5, marginTop: 6 },
  asosiySub: { color: '#CFE0F7', fontSize: 12, marginTop: 6 },
  davomWrap: { marginHorizontal: 16, marginTop: 4 },
  davomSarlavha: { fontWeight: '700', color: RANG.toq, fontSize: 13, marginBottom: 8 },
  davomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: RANG.oq, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: RANG.chiziq },
  davomIsh: { fontWeight: '700', color: RANG.toq, fontSize: 14 },
  davomBosqich: { color: RANG.sariq, fontSize: 12, marginTop: 3, fontWeight: '600' },
  davomOq: { fontSize: 20, color: RANG.asosiy },
  ikkinchiBtn: { backgroundColor: RANG.oq, marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: RANG.chiziq },
  ikkinchiText: { fontWeight: '700', fontSize: 16, color: RANG.toq },
  ikkinchiSub: { color: RANG.kul, fontSize: 12.5, marginTop: 3 },
  info: { margin: 16, backgroundColor: RANG.oq, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: RANG.chiziq },
  infoTitle: { fontWeight: '700', color: RANG.toq, marginBottom: 8 },
  infoRow: { color: '#4B5866', fontSize: 13, lineHeight: 22 },
  versiya: { textAlign: 'center', color: RANG.kul, fontSize: 11.5, marginBottom: 24 }
});

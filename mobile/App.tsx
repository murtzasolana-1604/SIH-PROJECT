import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from './constants/theme';
import { WorkerProfile } from './types/auth';

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { RoleSelectScreen } from './screens/RoleSelectScreen';

// Customer Screens
import { CustomerLoginScreen } from './screens/customer/CustomerLoginScreen';
import { CustomerOtpScreen } from './screens/customer/CustomerOtpScreen';
import { CustomerOnboardingScreen } from './screens/customer/CustomerOnboardingScreen';
import { CustomerHomeScreen } from './screens/customer/CustomerHomeScreen';
import { ServiceWorkersScreen } from './screens/customer/ServiceWorkersScreen';
import { WorkerDetailScreen } from './screens/customer/WorkerDetailScreen';
import { BookingScreen } from './screens/customer/BookingScreen';
import { CustomerBookingsScreen } from './screens/customer/CustomerBookingsScreen';
import { BookingDetailScreen } from './screens/customer/BookingDetailScreen';
import { EmergencySosScreen } from './screens/customer/EmergencySosScreen';
import { SahkaarSaathiScreen } from './screens/customer/SahkaarSaathiScreen';
import { CustomerProfileScreen } from './screens/customer/CustomerProfileScreen';

// Worker Screens
import { WorkerLoginScreen } from './screens/worker/WorkerLoginScreen';
import { WorkerOtpScreen } from './screens/worker/WorkerOtpScreen';
import { WorkerOnboardingScreen } from './screens/worker/WorkerOnboardingScreen';
import { WorkerDashboardScreen } from './screens/worker/WorkerDashboardScreen';
import { WorkerJobsScreen } from './screens/worker/WorkerJobsScreen';
import { WorkerJobDetailScreen } from './screens/worker/WorkerJobDetailScreen';
import { WorkerEarningsScreen } from './screens/worker/WorkerEarningsScreen';
import { WorkerWelfareScreen } from './screens/worker/WorkerWelfareScreen';
import { WorkerProfileScreen } from './screens/worker/WorkerProfileScreen';

type CustomerTab = 'home' | 'bookings' | 'saathi' | 'profile';
type WorkerTab = 'dashboard' | 'jobs' | 'earnings' | 'profile';

const MainNavigator: React.FC = () => {
  const { t, language } = useLanguage();
  const { role, isAuthenticated, isLoading, customerProfile, workerProfile, logout } = useAuth();
  const { isRenderWarmingUp } = useNetwork();

  // Navigation State
  const [screen, setScreen] = useState<string>('splash');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [workerTab, setWorkerTab] = useState<WorkerTab>('dashboard');

  // Customer Navigation Params
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState('');

  // Worker Navigation Params
  const [workerPhone, setWorkerPhone] = useState('');
  const [selectedWorkerBookingId, setSelectedWorkerBookingId] = useState('');
  const [jobsInitialTab, setJobsInitialTab] = useState<any>('all');

  // Sync auth state
  useEffect(() => {
    if (!isLoading && screen === 'splash') {
      // Stay on splash until Splash component completes animation
    }
  }, [isLoading, screen]);

  const handleSplashFinish = () => {
    if (isAuthenticated) {
      if (role === 'worker') {
        setScreen('worker_main');
      } else {
        setScreen('customer_main');
      }
    } else {
      setScreen('role_select');
    }
  };

  const handleLogout = async () => {
    await logout();
    setScreen('role_select');
    setCustomerTab('home');
    setWorkerTab('dashboard');
  };

  // Render bottom bar for Customer
  const renderCustomerBottomBar = () => {
    const tabs: { key: CustomerTab; label: string; icon: any; iconActive: any }[] = [
      { key: 'home', label: t.home, icon: 'home-outline', iconActive: 'home' },
      { key: 'bookings', label: t.bookings, icon: 'calendar-outline', iconActive: 'calendar' },
      { key: 'saathi', label: 'सहकार साथी', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
      { key: 'profile', label: t.profile, icon: 'person-outline', iconActive: 'person' },
    ];

    return (
      <View style={styles.bottomBar}>
        {tabs.map((tab) => {
          const isActive = customerTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => setCustomerTab(tab.key)}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActiveCustomer]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render bottom bar for Worker
  const renderWorkerBottomBar = () => {
    const tabs: { key: WorkerTab; label: string; icon: any; iconActive: any }[] = [
      { key: 'dashboard', label: t.dashboard, icon: 'grid-outline', iconActive: 'grid' },
      { key: 'jobs', label: t.myJobs, icon: 'briefcase-outline', iconActive: 'briefcase' },
      { key: 'earnings', label: t.earnings, icon: 'wallet-outline', iconActive: 'wallet' },
      { key: 'profile', label: t.profile, icon: 'person-outline', iconActive: 'person' },
    ];

    return (
      <View style={styles.bottomBar}>
        {tabs.map((tab) => {
          const isActive = workerTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => setWorkerTab(tab.key)}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={22}
                color={isActive ? COLORS.secondary : COLORS.textTertiary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActiveWorker]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.surface}
        translucent={Platform.OS === 'android'}
      />

      {/* Render Server Warmup Indicator */}
      {isRenderWarmingUp && (
        <View style={styles.warmupNotice}>
          <Ionicons name="cloud-upload-outline" size={14} color={COLORS.secondaryDark} />
          <Text style={styles.warmupText}>
            {language === 'hi'
              ? 'सहकार क्लाउड सर्वर तैयार हो रहा है (कृपया प्रतीक्षा करें)...'
              : 'Connecting to Sahkaar Cloud on Render...'}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Splash */}
        {screen === 'splash' && <SplashScreen onFinish={handleSplashFinish} />}

        {/* Role Select */}
        {screen === 'role_select' && (
          <RoleSelectScreen
            onSelectRole={(selected) => {
              if (selected === 'customer') {
                setScreen('customer_login');
              } else {
                setScreen('worker_login');
              }
            }}
          />
        )}

        {/* CUSTOMER AUTH SCREENS */}
        {screen === 'customer_login' && (
          <CustomerLoginScreen
            onBack={() => setScreen('role_select')}
            onOtpSent={(ph) => {
              setCustomerPhone(ph);
              setScreen('customer_otp');
            }}
          />
        )}

        {screen === 'customer_otp' && (
          <CustomerOtpScreen
            phone={customerPhone}
            onBack={() => setScreen('customer_login')}
            onSuccess={(needsOnboarding) => {
              if (needsOnboarding) {
                setScreen('customer_onboarding');
              } else {
                setScreen('customer_main');
                setCustomerTab('home');
              }
            }}
          />
        )}

        {screen === 'customer_onboarding' && (
          <CustomerOnboardingScreen
            onComplete={() => {
              setScreen('customer_main');
              setCustomerTab('home');
            }}
          />
        )}

        {/* WORKER AUTH SCREENS */}
        {screen === 'worker_login' && (
          <WorkerLoginScreen
            onBack={() => setScreen('role_select')}
            onOtpSent={(ph) => {
              setWorkerPhone(ph);
              setScreen('worker_otp');
            }}
          />
        )}

        {screen === 'worker_otp' && (
          <WorkerOtpScreen
            phone={workerPhone}
            onBack={() => setScreen('worker_login')}
            onSuccess={(needsOnboarding) => {
              if (needsOnboarding) {
                setScreen('worker_onboarding');
              } else {
                setScreen('worker_main');
                setWorkerTab('dashboard');
              }
            }}
          />
        )}

        {screen === 'worker_onboarding' && (
          <WorkerOnboardingScreen
            onComplete={() => {
              setScreen('worker_main');
              setWorkerTab('dashboard');
            }}
          />
        )}

        {/* CUSTOMER NESTED SCREENS */}
        {screen === 'customer_workers' && (
          <ServiceWorkersScreen
            serviceName={selectedService}
            onBack={() => setScreen('customer_main')}
            onSelectWorker={(w) => {
              setSelectedWorker(w);
              setScreen('customer_worker_detail');
            }}
            onBookService={() => {
              setScreen('customer_book');
            }}
          />
        )}

        {screen === 'customer_worker_detail' && selectedWorker && (
          <WorkerDetailScreen
            worker={selectedWorker}
            onBack={() => setScreen('customer_workers')}
            onBook={() => setScreen('customer_book')}
          />
        )}

        {screen === 'customer_book' && (
          <BookingScreen
            serviceName={selectedService || 'General Cooperative Service'}
            worker={selectedWorker || undefined}
            onBack={() => setScreen('customer_main')}
            onSuccess={() => {
              setScreen('customer_main');
              setCustomerTab('bookings');
            }}
          />
        )}

        {screen === 'customer_booking_detail' && (
          <BookingDetailScreen
            bookingId={selectedBookingId}
            onBack={() => {
              setScreen('customer_main');
              setCustomerTab('bookings');
            }}
          />
        )}

        {screen === 'customer_emergency' && (
          <EmergencySosScreen
            onBack={() => setScreen('customer_main')}
            onBookingCreated={(bId) => {
              setSelectedBookingId(bId);
              setScreen('customer_booking_detail');
            }}
          />
        )}

        {/* CUSTOMER MAIN APP WITH BOTTOM TABS */}
        {screen === 'customer_main' && (
          <View style={styles.tabContainer}>
            <View style={styles.tabContent}>
              {customerTab === 'home' && (
                <CustomerHomeScreen
                  onSelectService={(srv) => {
                    setSelectedService(srv);
                    setSelectedWorker(null);
                    setScreen('customer_workers');
                  }}
                  onSelectWorker={(w) => {
                    setSelectedWorker(w);
                    setSelectedService(w.skills?.[0] || w.skill || 'General');
                    setScreen('customer_worker_detail');
                  }}
                  onEmergencyPress={() => setScreen('customer_emergency')}
                  onSaathiPress={() => setCustomerTab('saathi')}
                />
              )}

              {customerTab === 'bookings' && (
                <CustomerBookingsScreen
                  onSelectBooking={(b: any) => {
                    const idStr = typeof b === 'object' && b ? String(b.id) : String(b);
                    setSelectedBookingId(idStr);
                    setScreen('customer_booking_detail');
                  }}
                />
              )}

              {customerTab === 'saathi' && (
                <SahkaarSaathiScreen
                  onBack={() => setCustomerTab('home')}
                  onNavigateToBooking={(srv) => {
                    setSelectedService(srv || 'Electrician');
                    setScreen('customer_book');
                  }}
                  onNavigateToEmergency={() => setScreen('customer_emergency')}
                />
              )}

              {customerTab === 'profile' && (
                <CustomerProfileScreen onLogout={handleLogout} />
              )}
            </View>

            {renderCustomerBottomBar()}
          </View>
        )}

        {/* WORKER NESTED SCREENS */}
        {screen === 'worker_job_detail' && (
          <WorkerJobDetailScreen
            bookingId={selectedWorkerBookingId}
            onBack={() => setScreen('worker_main')}
          />
        )}

        {screen === 'worker_welfare' && (
          <WorkerWelfareScreen onBack={() => setScreen('worker_main')} />
        )}

        {screen === 'worker_saathi' && (
          <SahkaarSaathiScreen
            onBack={() => setScreen('worker_main')}
            onNavigateToBooking={() => {}}
            onNavigateToEmergency={() => {}}
          />
        )}

        {/* WORKER MAIN APP WITH BOTTOM TABS */}
        {screen === 'worker_main' && (
          <View style={styles.tabContainer}>
            <View style={styles.tabContent}>
              {workerTab === 'dashboard' && (
                <WorkerDashboardScreen
                  onNavigateToJobs={(tab) => {
                    setJobsInitialTab(tab || 'all');
                    setWorkerTab('jobs');
                  }}
                  onNavigateToJobDetail={(bId) => {
                    setSelectedWorkerBookingId(bId);
                    setScreen('worker_job_detail');
                  }}
                  onNavigateToEarnings={() => setWorkerTab('earnings')}
                  onNavigateToWelfare={() => setScreen('worker_welfare')}
                  onNavigateToSaathi={() => setScreen('worker_saathi')}
                />
              )}

              {workerTab === 'jobs' && (
                <WorkerJobsScreen
                  initialTab={jobsInitialTab}
                  onNavigateToJobDetail={(bId) => {
                    setSelectedWorkerBookingId(bId);
                    setScreen('worker_job_detail');
                  }}
                />
              )}

              {workerTab === 'earnings' && <WorkerEarningsScreen />}

              {workerTab === 'profile' && <WorkerProfileScreen onLogout={handleLogout} />}
            </View>

            {renderWorkerBottomBar()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  // Load all Ionicons fonts so they render correctly in Hermes release builds
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  // Show crash info on screen if fonts fail (helps diagnose native crashes)
  if (fontError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#15803D', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>🏛️ Sahkaar Connect</Text>
        <Text style={{ color: '#FEF08A', fontSize: 14, fontWeight: '700', marginBottom: 16 }}>Font Load Error (Report to developer)</Text>
        <ScrollView style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, maxHeight: 300 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'monospace' }}>
            {fontError.message}
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show loading while fonts are being prepared
  if (!fontsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#15803D', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 32, marginBottom: 16 }}>🤝</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>Sahkaar Connect</Text>
        <Text style={{ color: '#DCFCE7', fontSize: 14, marginTop: 8 }}>Loading cooperative platform...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <NetworkProvider>
              <MainNavigator />
            </NetworkProvider>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SPACING.xs,
    paddingBottom: 4,
    ...SHADOWS.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActiveCustomer: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabLabelActiveWorker: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  warmupNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  warmupText: {
    fontSize: 10,
    color: COLORS.secondaryDark,
    fontWeight: '600',
  },
});

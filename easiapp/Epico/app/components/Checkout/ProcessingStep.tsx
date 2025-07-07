import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProcessingStep: React.FC = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
  // Simulate processing steps
  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prevStep => {
        if (prevStep < totalSteps) {
          return prevStep + 1;
        }
        clearInterval(timer);
        return prevStep;
      });
    }, 600);
    
    return () => clearInterval(timer);
  }, []);
  
  const getStepColor = (stepNumber: number) => {
    if (stepNumber < step) return '#4CAF50'; // Completed
    if (stepNumber === step) return '#1a1a1a'; // Current
    return '#ccc'; // Upcoming
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingText}>Processing Your Order</Text>
        <Text style={styles.loadingSubtext}>Please don't close this screen</Text>
      </View>
      
      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: getStepColor(1) }]}>
            {step > 1 ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : step === 1 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : null}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(1) }]}>Verifying Order</Text>
            <Text style={styles.stepDescription}>Checking product availability</Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: getStepColor(2) }]}>
            {step > 2 ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : step === 2 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : null}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(2) }]}>Processing Payment</Text>
            <Text style={styles.stepDescription}>Securely processing your payment</Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: getStepColor(3) }]}>
            {step > 3 ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : step === 3 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : null}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(3) }]}>Confirming Delivery</Text>
            <Text style={styles.stepDescription}>Scheduling your delivery slot</Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: getStepColor(4) }]}>
            {step > 4 ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : step === 4 ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : null}
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepText, { color: getStepColor(4) }]}>Finalizing Order</Text>
            <Text style={styles.stepDescription}>Preparing your order confirmation</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#f0f0f0',
    marginLeft: 11,
  },
});

export default ProcessingStep; 
/**
 * Rating Stars Component
 * Supports static star display with count or interactive 1-5 star picker
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "../../constants/theme";

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onSelectRating?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  size = 14,
  interactive = false,
  onSelectRating,
}) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {stars.map((star) => {
          const filled = star <= Math.round(rating);
          if (interactive && onSelectRating) {
            return (
              <TouchableOpacity
                key={star}
                onPress={() => onSelectRating(star)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                style={styles.starTouch}
              >
                <Text style={[styles.starText, { fontSize: size + 6, color: filled ? "#F59E0B" : "#CBD5E1" }]}>
                  ★
                </Text>
              </TouchableOpacity>
            );
          }
          return (
            <Text
              key={star}
              style={[
                styles.starText,
                {
                  fontSize: size,
                  color: filled ? "#F59E0B" : "#CBD5E1",
                },
              ]}
            >
              ★
            </Text>
          );
        })}
      </View>
      {!interactive && (
        <Text style={[styles.ratingNumber, { fontSize: size }]}>
          {rating.toFixed(1)} {count !== undefined && `(${count})`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starTouch: {
    paddingHorizontal: 3,
  },
  starText: {
    marginRight: 1,
  },
  ratingNumber: {
    marginLeft: 4,
    fontWeight: "700",
    color: THEME.colors.textSecondary,
  },
});

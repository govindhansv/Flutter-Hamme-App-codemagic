import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/colors.dart';

class SkeletonMatchCard extends StatelessWidget {
  const SkeletonMatchCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: TColors.grey.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(14),
      ),
    );
  }
}

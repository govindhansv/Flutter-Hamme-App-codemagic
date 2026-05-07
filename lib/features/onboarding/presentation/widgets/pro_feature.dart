import 'package:flutter/material.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/fonts.dart';

class ProFeature extends StatelessWidget {
  const ProFeature({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final String icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: const BoxDecoration(
            color: TColors.white,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            icon,
            style: const TextStyle(
              fontSize: 32,
              color: TColors.hammePrimaryDark,
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontFamily: TFonts.nunito,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: TColors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  fontFamily: TFonts.nunito,
                  fontSize: 14,
                  height: 1.25,
                  fontWeight: FontWeight.w600,
                  color: TColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

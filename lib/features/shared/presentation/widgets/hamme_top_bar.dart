import 'package:flutter/cupertino.dart';
import 'package:hamme_app/utils/constants/colors.dart';
import 'package:hamme_app/utils/constants/image_strings.dart';

class HammeTopBar extends StatelessWidget {
  const HammeTopBar({super.key, this.onLeftTap, this.onRightTap});

  final VoidCallback? onLeftTap;
  final VoidCallback? onRightTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _TopBarCircleButton(
            icon: CupertinoIcons.doc_on_doc,
            onTap: onLeftTap,
          ),
          Image.asset(TImages.hammeHomeLogo, height: 30),
          _TopBarCircleButton(
            icon: CupertinoIcons.person_solid,
            onTap: onRightTap,
          ),
        ],
      ),
    );
  }
}

class _TopBarCircleButton extends StatelessWidget {
  const _TopBarCircleButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: const BoxDecoration(
          color: TColors.hammeSurface,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 20, color: TColors.black),
      ),
    );
  }
}

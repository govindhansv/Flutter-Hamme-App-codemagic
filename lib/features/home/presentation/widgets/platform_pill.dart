import 'package:flutter/material.dart';

class PlatformPill extends StatelessWidget {
  const PlatformPill({
    super.key,
    required this.selected,
    required this.icon,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 116,
        height: 40,
        decoration: BoxDecoration(
          color: selected ? Colors.white : const Color(0xFF606060),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Icon(
          icon,
          color: selected ? Colors.black : Colors.white,
          size: 24,
        ),
      ),
    );
  }
}

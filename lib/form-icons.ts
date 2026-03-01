import {
  FileText, Star, Clipboard, Users, Settings, Bell, Briefcase, Book,
  Heart, Globe, Shield, Zap, Award, Target, MessageSquare, Calendar,
  BarChart2, CheckCircle, HelpCircle, Mail, Code, Layers, Box,
  Flag, Lightbulb, Rocket, Smile, Lock, Eye, Send,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const FORM_ICONS: Record<string, LucideIcon> = {
  FileText,
  Star,
  Clipboard,
  Users,
  Settings,
  Bell,
  Briefcase,
  Book,
  Heart,
  Globe,
  Shield,
  Zap,
  Award,
  Target,
  MessageSquare,
  Calendar,
  BarChart2,
  CheckCircle,
  HelpCircle,
  Mail,
  Code,
  Layers,
  Box,
  Flag,
  Lightbulb,
  Rocket,
  Smile,
  Lock,
  Eye,
  Send,
}

export function getFormIcon(name?: string | null): LucideIcon {
  if (!name) return FileText
  return FORM_ICONS[name] ?? FileText
}

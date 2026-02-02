import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  th: {
    // Navigation
    'nav.projects': 'โปรเจกต์',
    'nav.overview': 'ภาพรวม',
    'nav.apiKeys': 'API Keys',
    'nav.playground': 'Playground',
    'nav.documentation': 'เอกสาร',
    'nav.usage': 'การใช้งาน',
    'nav.billing': 'ค่าใช้จ่าย',
    'nav.dashboard': 'แดชบอร์ด',
    'nav.settings': 'การตั้งค่า',
    'nav.signOut': 'ออกจากระบบ',
    'nav.logout': 'ออกจากระบบ',
    
    // Project Selector
    'projects.title': 'เลือกโปรเจกต์',
    'projects.subtitle': 'เลือกโปรเจกต์เพื่อเข้าสู่ Dashboard หรือสร้างโปรเจกต์ใหม่',
    'projects.createNew': 'สร้างโปรเจกต์ใหม่',
    'projects.name': 'ชื่อโปรเจกต์',
    'projects.description': 'คำอธิบาย',
    'projects.environment': 'สภาพแวดล้อม',
    'projects.development': 'Development',
    'projects.staging': 'Staging',
    'projects.production': 'Production',
    'projects.create': 'สร้างโปรเจกต์',
    'projects.cancel': 'ยกเลิก',
    'projects.creating': 'กำลังสร้าง...',
    'projects.created': 'สร้างโปรเจกต์สำเร็จ',
    'projects.createFailed': 'ไม่สามารถสร้างโปรเจกต์ได้',
    'projects.empty': 'ยังไม่มีโปรเจกต์',
    'projects.emptyDesc': 'สร้างโปรเจกต์แรกเพื่อเริ่มใช้งาน ALEXZA APIs',
    
    // Project Overview
    'overview.title': 'ภาพรวมโปรเจกต์',
    'overview.apiStatus': 'สถานะ TTI API',
    'overview.operational': 'ใช้งานได้ปกติ',
    'overview.stats24h': 'สถิติ 24 ชั่วโมงล่าสุด',
    'overview.totalRequests': 'จำนวน Requests ทั้งหมด',
    'overview.successRate': 'อัตราความสำเร็จ',
    'overview.avgResponseTime': 'เวลาตอบสนองเฉลี่ย',
    'overview.totalCost': 'ค่าใช้จ่ายรวม',
    'overview.quickActions': 'การกระทำด่วน',
    'overview.createApiKey': 'สร้าง API Key',
    'overview.viewDocs': 'ดูเอกสาร',
    'overview.testPlayground': 'ทดสอบ Playground',
    
    // API Keys
    'apiKeys.title': 'API Keys',
    'apiKeys.subtitle': 'จัดการ API keys สำหรับเข้าถึง TTI API',
    'apiKeys.create': 'สร้าง API Key',
    'apiKeys.name': 'ชื่อ Key',
    'apiKeys.keyPrefix': 'Key Prefix',
    'apiKeys.created': 'สร้างเมื่อ',
    'apiKeys.lastUsed': 'ใช้งานล่าสุด',
    'apiKeys.actions': 'การกระทำ',
    'apiKeys.copy': 'คัดลอก',
    'apiKeys.revoke': 'เพิกถอน',
    'apiKeys.copied': 'คัดลอกแล้ว',
    'apiKeys.revokeConfirm': 'คุณแน่ใจหรือไม่ที่จะเพิกถอน API key นี้?',
    'apiKeys.revokeWarning': 'การกระทำนี้ไม่สามารถย้อนกลับได้',
    'apiKeys.revoked': 'เพิกถอน API key สำเร็จ',
    'apiKeys.never': 'ไม่เคยใช้',
    'apiKeys.empty': 'ยังไม่มี API Keys',
    'apiKeys.emptyDesc': 'สร้าง API key แรกของคุณเพื่อเริ่มใช้งาน TTI API',
    'apiKeys.newKey': 'API Key ใหม่',
    'apiKeys.saveKey': 'บันทึก API Key นี้ไว้ในที่ปลอดภัย คุณจะไม่สามารถดูได้อีกครั้ง',
    'apiKeys.close': 'ปิด',
    
    // Playground
    'playground.title': 'Playground',
    'playground.subtitle': 'ทดสอบ TTI API แบบ Interactive',
    'playground.inputLabel': 'ข้อความภาษาไทย',
    'playground.inputPlaceholder': 'กรอกข้อความภาษาไทยที่ต้องการวิเคราะห์...',
    'playground.analyze': 'วิเคราะห์',
    'playground.analyzing': 'กำลังวิเคราะห์...',
    'playground.clear': 'ล้าง',
    'playground.results': 'ผลลัพธ์',
    'playground.step1': 'ขั้นตอนที่ 1: Input',
    'playground.step2': 'ขั้นตอนที่ 2: AI Translation',
    'playground.step3': 'ขั้นตอนที่ 3: Rule Engine',
    'playground.step4': 'ขั้นตอนที่ 4: Result',
    'playground.detectedLanguage': 'ภาษาที่ตรวจพบ',
    'playground.intent': 'Intent',
    'playground.confidence': 'ความมั่นใจ',
    'playground.entities': 'Entities',
    'playground.rulesApplied': 'Rules ที่ใช้',
    'playground.processedText': 'ข้อความที่ประมวลผล',
    'playground.typographyScore': 'Typography Score',
    'playground.characterCount': 'จำนวนตัวอักษร',
    'playground.wordCount': 'จำนวนคำ',
    'playground.responseTime': 'เวลาตอบสนอง',
    
    // Documentation
    'docs.title': 'เอกสาร API',
    'docs.subtitle': 'คู่มือการใช้งาน TTI API',
    'docs.gettingStarted': 'เริ่มต้นใช้งาน',
    'docs.authentication': 'การยืนยันตัวตน',
    'docs.endpoints': 'API Endpoints',
    'docs.examples': 'ตัวอย่างโค้ด',
    'docs.authDesc': 'ใช้ API key ของคุณใน Authorization header',
    'docs.analyzeEndpoint': 'Analyze Text Endpoint',
    'docs.request': 'Request',
    'docs.response': 'Response',
    'docs.codeExamples': 'ตัวอย่างโค้ด',
    
    // Usage & Billing
    'usage.title': 'การใช้งาน',
    'usage.subtitle': 'ติดตามการใช้งาน API และค่าใช้จ่าย',
    'usage.currentCycle': 'รอบการใช้งานปัจจุบัน',
    'usage.requests': 'Requests',
    'usage.quota': 'Quota',
    'usage.cost': 'ค่าใช้จ่าย',
    'usage.cycleEnds': 'รอบสิ้นสุด',
    'usage.usageChart': 'กราฟการใช้งาน',
    'usage.last24h': '24 ชั่วโมงล่าสุด',
    'usage.requestsPerHour': 'Requests ต่อชั่วโมง',
    'billing.title': 'ค่าใช้จ่าย',
    'billing.subtitle': 'ประวัติและรายละเอียดค่าใช้จ่าย',
    'billing.history': 'ประวัติการใช้งาน',
    'billing.period': 'ช่วงเวลา',
    'billing.status': 'สถานะ',
    'billing.paid': 'ชำระแล้ว',
    'billing.exceeded': 'เกิน Quota',
    'billing.active': 'กำลังใช้งาน',
    
    // Quick Start
    'quickstart.title': 'Quick Start Guide',
    'quickstart.subtitle': 'เริ่มใช้งาน TTI API ภายใน 5 นาที',
    'quickstart.getStarted': 'เริ่มต้นเลย',
    'quickstart.tryPlayground': 'ทดลองใน Playground',
    'quickstart.steps': 'ขั้นตอน',
    'quickstart.next': 'ถัดไป',
    'quickstart.back': 'กลับ',
    
    'quickstart.step1.title': 'สร้างโปรเจกต์',
    'quickstart.step1.description': 'สร้างโปรเจกต์แรกเพื่อจัดการ API keys และติดตามการใช้งาน',
    'quickstart.step1.time': '30 วินาที',
    'quickstart.step1.whatYouNeed': 'สิ่งที่คุณต้องมี',
    'quickstart.step1.requirement1': 'บัญชี ALEXZA SYSTEMS (คุณมีอยู่แล้ว)',
    'quickstart.step1.requirement2': 'ชื่อโปรเจกต์ที่ต้องการสร้าง',
    'quickstart.step1.howTo': 'วิธีสร้างโปรเจกต์',
    'quickstart.step1.instruction1': 'ไปที่หน้า "โปรเจกต์" จากเมนูด้านซ้าย',
    'quickstart.step1.instruction2': 'คลิกปุ่ม "สร้างโปรเจกต์ใหม่"',
    'quickstart.step1.instruction3': 'กรอกชื่อโปรเจกต์ เลือก environment (แนะนำ Development) และคลิก "สร้างโปรเจกต์"',
    
    'quickstart.step2.title': 'สร้าง API Key',
    'quickstart.step2.description': 'สร้าง API key เพื่อใช้ในการเรียก TTI API',
    'quickstart.step2.time': '15 วินาที',
    'quickstart.step2.howTo': 'วิธีสร้าง API Key',
    'quickstart.step2.instruction1': 'เลือกโปรเจกต์ที่สร้างไว้',
    'quickstart.step2.instruction2': 'ไปที่หน้า "API Keys" จากเมนูด้านซ้าย',
    'quickstart.step2.instruction3': 'คลิก "Create API Key" กรอกชื่อ และคัดลอก key ที่ได้',
    'quickstart.step2.warning': 'คำเตือนสำคัญ',
    'quickstart.step2.warningText': 'คัดลอกและเก็บ API key ไว้ในที่ปลอดภัย คุณจะไม่สามารถดู key นี้อีกครั้งหลังจากปิดหน้าต่างนี้',
    
    'quickstart.step3.title': 'ส่ง Request แรก',
    'quickstart.step3.description': 'ทดสอบ API ด้วยการส่ง request แรกของคุณ',
    'quickstart.step3.time': '2 นาที',
    'quickstart.step3.chooseMethod': 'เลือกวิธีที่คุณต้องการ',
    'quickstart.step3.methodDescription': 'เลือกภาษาโปรแกรมหรือเครื่องมือที่คุณถนัด',
    'quickstart.step3.expectedResponse': 'ผลลัพธ์ที่คาดหวัง',
    
    'quickstart.preview.title': 'ตัวอย่างโค้ดสุดท้าย',
    'quickstart.preview.description': 'นี่คือโค้ดที่คุณจะได้หลังจากทำตาม 3 ขั้นตอน',
    'quickstart.preview.followSteps': 'ทำตาม 3 ขั้นตอนด้านล่างเพื่อเริ่มใช้งาน TTI API',
    
    'quickstart.nextSteps.title': 'ขั้นตอนถัดไป',
    'quickstart.nextSteps.description': 'ตอนนี้คุณพร้อมแล้ว ลองสำรวจฟีเจอร์เพิ่มเติม',
    'quickstart.nextSteps.docs': 'อ่านเอกสาร',
    'quickstart.nextSteps.docsDescription': 'เรียนรู้เพิ่มเติมเกี่ยวกับ API endpoints และตัวเลือกต่างๆ',
    'quickstart.nextSteps.playground': 'ทดลองใน Playground',
    'quickstart.nextSteps.playgroundDescription': 'ทดสอบ API แบบ interactive โดยไม่ต้องเขียนโค้ด',
    
    // Common
    'common.loading': 'กำลังโหลด...',
    'common.error': 'เกิดข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.view': 'ดู',
    'common.back': 'กลับ',
    'common.next': 'ถัดไป',
    'common.previous': 'ก่อนหน้า',
    'common.search': 'ค้นหา',
    'common.filter': 'กรอง',
    'common.sort': 'เรียง',
    'common.export': 'ส่งออก',
    'common.import': 'นำเข้า',
    'common.refresh': 'รีเฟรช',
    'common.copied': 'คัดลอกแล้ว',
    'common.add': 'เพิ่ม',
    'common.readOnly': 'อ่านอย่างเดียว',
    'common.active': 'ใช้งานอยู่',
    'common.inactive': 'ไม่ได้ใช้งาน',
    
    // Settings
    'settings.title': 'การตั้งค่า',
    'settings.subtitle': 'จัดการการตั้งค่าโปรเจกต์และความปลอดภัย',
    'settings.tabs.project': 'โปรเจกต์',
    'settings.tabs.security': 'ความปลอดภัย',
    'settings.tabs.limits': 'ข้อจำกัด',
    'settings.tabs.webhooks': 'Webhooks',
    'settings.tabs.notifications': 'การแจ้งเตือน',
    
    // Project Settings
    'settings.project.title': 'การตั้งค่าโปรเจกต์',
    'settings.project.description': 'จัดการข้อมูลพื้นฐานของโปรเจกต์',
    'settings.project.name': 'ชื่อโปรเจกต์',
    'settings.project.nameHelp': 'ชื่อที่จะแสดงใน Dashboard และรายงาน',
    'settings.project.environment': 'สภาพแวดล้อม',
    'settings.project.environmentHelp': 'ไม่สามารถเปลี่ยนได้หลังจากสร้างโปรเจกต์',
    'settings.project.language': 'ภาษาเริ่มต้น',
    'settings.project.languageHelp': 'ภาษาที่ใช้แสดงใน Dashboard',
    'settings.project.timezone': 'เขตเวลา',
    'settings.project.timezoneHelp': 'เขตเวลาสำหรับแสดงวันที่และเวลา',
    
    // Security Settings
    'settings.security.ipWhitelist': 'IP Whitelist',
    'settings.security.ipWhitelistDesc': 'จำกัดการเข้าถึง API เฉพาะ IP ที่ระบุไว้',
    'settings.security.addIp': 'เพิ่ม IP Address',
    'settings.security.ipFormat': 'รูปแบบ: 192.168.1.1',
    'settings.security.allowedIps': 'IP ที่อนุญาต',
    'settings.security.noIps': 'ยังไม่มี IP ใน whitelist',
    'settings.security.apiKeyVisibility': 'การแสดง API Key',
    'settings.security.apiKeyVisibilityDesc': 'ควบคุมวิธีการแสดง API keys ใน Dashboard',
    'settings.security.showFullKey': 'แสดงเต็ม',
    'settings.security.showFullKeyDesc': 'แสดง API key ทั้งหมด',
    'settings.security.maskKey': 'ซ่อนบางส่วน',
    'settings.security.maskKeyDesc': 'แสดงเฉพาะตัวอักษรแรกและตัวสุดท้าย',
    
    // Rate Limits
    'settings.limits.title': 'ข้อจำกัดและ Quota',
    'settings.limits.description': 'ตรวจสอบการใช้งานและข้อจำกัดปัจจุบัน',
    'settings.limits.requestsPerMinute': 'Requests ต่อนาที',
    'settings.limits.requestsPerMinuteDesc': 'จำนวน requests สูงสุดต่อนาที',
    'settings.limits.requestsPerDay': 'Requests ต่อวัน',
    'settings.limits.requestsPerDayDesc': 'จำนวน requests สูงสุดต่อวัน',
    'settings.limits.monthlyQuota': 'Quota รายเดือน',
    'settings.limits.monthlyQuotaDesc': 'จำนวน requests ที่ใช้ได้ในเดือนนี้',
    'settings.limits.upgradeNote': 'ต้องการเพิ่มข้อจำกัด? ติดต่อทีมขาย',
    
    // Webhooks
    'settings.webhooks.title': 'Webhooks',
    'settings.webhooks.description': 'รับการแจ้งเตือนแบบ real-time เมื่อมีเหตุการณ์สำคัญ',
    'settings.webhooks.endpointUrl': 'Endpoint URL',
    'settings.webhooks.events': 'เหตุการณ์ที่ต้องการรับ',
    'settings.webhooks.addWebhook': 'เพิ่ม Webhook',
    'settings.webhooks.configured': 'Webhooks ที่ตั้งค่าไว้',
    'settings.webhooks.eventsSelected': 'เหตุการณ์',
    
    // Notifications
    'settings.notifications.title': 'การแจ้งเตือน',
    'settings.notifications.description': 'จัดการวิธีการรับการแจ้งเตือน',
    'settings.notifications.email': 'อีเมล',
    'settings.notifications.emailDesc': 'รับการแจ้งเตือนทางอีเมล',
    'settings.notifications.inApp': 'ในแอป',
    'settings.notifications.inAppDesc': 'แสดงการแจ้งเตือนใน Dashboard',
    'settings.notifications.types': 'ประเภทการแจ้งเตือน',
    'settings.notifications.quotaAlerts': 'แจ้งเตือน Quota',
    'settings.notifications.quotaAlertsDesc': 'เมื่อใกล้ถึงหรือเกิน quota',
    'settings.notifications.securityAlerts': 'แจ้งเตือนความปลอดภัย',
    'settings.notifications.securityAlertsDesc': 'การเข้าถึงที่ผิดปกติหรือการใช้งานผิดปกติ',
    'settings.notifications.usageReports': 'รายงานการใช้งาน',
    'settings.notifications.usageReportsDesc': 'สรุปรายสัปดาห์และรายเดือน',
    
    // Empty States
    'empty.noData': 'ไม่มีข้อมูล',
    'empty.noDataDesc': 'ยังไม่มีข้อมูลในช่วงเวลานี้',
    'empty.noKeys': 'ยังไม่มี API Keys',
    'empty.noKeysDesc': 'สร้าง API key แรกเพื่อเริ่มใช้งาน TTI API',
    'empty.noUsage': 'ยังไม่มีการใช้งาน',
    'empty.noUsageDesc': 'เริ่มส่ง requests เพื่อดูสถิติการใช้งาน',
    'empty.quotaExceeded': 'เกิน Quota',
    'empty.quotaExceededDesc': 'คุณได้ใช้ quota ครบแล้ว กรุณารอจนกว่าจะรีเซ็ตหรือติดต่อทีมขาย',
  },
  en: {
    // Navigation
    'nav.projects': 'Projects',
    'nav.overview': 'Overview',
    'nav.apiKeys': 'API Keys',
    'nav.playground': 'Playground',
    'nav.documentation': 'Documentation',
    'nav.usage': 'Usage',
    'nav.billing': 'Billing',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign Out',
    'nav.logout': 'Logout',
    
    // Project Selector
    'projects.title': 'Select Project',
    'projects.subtitle': 'Choose a project to access the dashboard or create a new one',
    'projects.createNew': 'Create New Project',
    'projects.name': 'Project Name',
    'projects.description': 'Description',
    'projects.environment': 'Environment',
    'projects.development': 'Development',
    'projects.staging': 'Staging',
    'projects.production': 'Production',
    'projects.create': 'Create Project',
    'projects.cancel': 'Cancel',
    'projects.creating': 'Creating...',
    'projects.created': 'Project created successfully',
    'projects.createFailed': 'Failed to create project',
    'projects.empty': 'No projects yet',
    'projects.emptyDesc': 'Create your first project to start using ALEXZA APIs',
    
    // Project Overview
    'overview.title': 'Project Overview',
    'overview.apiStatus': 'TTI API Status',
    'overview.operational': 'Operational',
    'overview.stats24h': 'Last 24 Hours Statistics',
    'overview.totalRequests': 'Total Requests',
    'overview.successRate': 'Success Rate',
    'overview.avgResponseTime': 'Avg Response Time',
    'overview.totalCost': 'Total Cost',
    'overview.quickActions': 'Quick Actions',
    'overview.createApiKey': 'Create API Key',
    'overview.viewDocs': 'View Documentation',
    'overview.testPlayground': 'Test in Playground',
    
    // API Keys
    'apiKeys.title': 'API Keys',
    'apiKeys.subtitle': 'Manage API keys for accessing TTI API',
    'apiKeys.create': 'Create API Key',
    'apiKeys.name': 'Key Name',
    'apiKeys.keyPrefix': 'Key Prefix',
    'apiKeys.created': 'Created',
    'apiKeys.lastUsed': 'Last Used',
    'apiKeys.actions': 'Actions',
    'apiKeys.copy': 'Copy',
    'apiKeys.revoke': 'Revoke',
    'apiKeys.copied': 'Copied',
    'apiKeys.revokeConfirm': 'Are you sure you want to revoke this API key?',
    'apiKeys.revokeWarning': 'This action cannot be undone',
    'apiKeys.revoked': 'API key revoked successfully',
    'apiKeys.never': 'Never used',
    'apiKeys.empty': 'No API Keys',
    'apiKeys.emptyDesc': 'Create your first API key to start using TTI API',
    'apiKeys.newKey': 'New API Key',
    'apiKeys.saveKey': 'Save this API key in a secure location. You won\'t be able to see it again.',
    'apiKeys.close': 'Close',
    
    // Playground
    'playground.title': 'Playground',
    'playground.subtitle': 'Test TTI API Interactively',
    'playground.inputLabel': 'Thai Text',
    'playground.inputPlaceholder': 'Enter Thai text to analyze...',
    'playground.analyze': 'Analyze',
    'playground.analyzing': 'Analyzing...',
    'playground.clear': 'Clear',
    'playground.results': 'Results',
    'playground.step1': 'Step 1: Input',
    'playground.step2': 'Step 2: AI Translation',
    'playground.step3': 'Step 3: Rule Engine',
    'playground.step4': 'Step 4: Result',
    'playground.detectedLanguage': 'Detected Language',
    'playground.intent': 'Intent',
    'playground.confidence': 'Confidence',
    'playground.entities': 'Entities',
    'playground.rulesApplied': 'Rules Applied',
    'playground.processedText': 'Processed Text',
    'playground.typographyScore': 'Typography Score',
    'playground.characterCount': 'Character Count',
    'playground.wordCount': 'Word Count',
    'playground.responseTime': 'Response Time',
    
    // Documentation
    'docs.title': 'API Documentation',
    'docs.subtitle': 'Guide to using TTI API',
    'docs.gettingStarted': 'Getting Started',
    'docs.authentication': 'Authentication',
    'docs.endpoints': 'API Endpoints',
    'docs.examples': 'Code Examples',
    'docs.authDesc': 'Use your API key in the Authorization header',
    'docs.analyzeEndpoint': 'Analyze Text Endpoint',
    'docs.request': 'Request',
    'docs.response': 'Response',
    'docs.codeExamples': 'Code Examples',
    
    // Usage & Billing
    'usage.title': 'Usage',
    'usage.subtitle': 'Track API usage and costs',
    'usage.currentCycle': 'Current Billing Cycle',
    'usage.requests': 'Requests',
    'usage.quota': 'Quota',
    'usage.cost': 'Cost',
    'usage.cycleEnds': 'Cycle Ends',
    'usage.usageChart': 'Usage Chart',
    'usage.last24h': 'Last 24 Hours',
    'usage.requestsPerHour': 'Requests per Hour',
    'billing.title': 'Billing',
    'billing.subtitle': 'Billing history and details',
    'billing.history': 'Usage History',
    'billing.period': 'Period',
    'billing.status': 'Status',
    'billing.paid': 'Paid',
    'billing.exceeded': 'Exceeded Quota',
    'billing.active': 'Active',
    
    // Quick Start
    'quickstart.title': 'Quick Start Guide',
    'quickstart.subtitle': 'Get started with TTI API in 5 minutes',
    'quickstart.getStarted': 'Get Started',
    'quickstart.tryPlayground': 'Try Playground',
    'quickstart.steps': 'Steps',
    'quickstart.next': 'Next',
    'quickstart.back': 'Back',
    
    'quickstart.step1.title': 'Create a Project',
    'quickstart.step1.description': 'Create your first project to manage API keys and track usage',
    'quickstart.step1.time': '30 seconds',
    'quickstart.step1.whatYouNeed': 'What you need',
    'quickstart.step1.requirement1': 'ALEXZA SYSTEMS account (you already have one)',
    'quickstart.step1.requirement2': 'A project name',
    'quickstart.step1.howTo': 'How to create a project',
    'quickstart.step1.instruction1': 'Go to "Projects" page from the left menu',
    'quickstart.step1.instruction2': 'Click "Create New Project" button',
    'quickstart.step1.instruction3': 'Enter project name, select environment (recommend Development), and click "Create Project"',
    
    'quickstart.step2.title': 'Get an API Key',
    'quickstart.step2.description': 'Create an API key to authenticate your requests',
    'quickstart.step2.time': '15 seconds',
    'quickstart.step2.howTo': 'How to create an API key',
    'quickstart.step2.instruction1': 'Select the project you just created',
    'quickstart.step2.instruction2': 'Go to "API Keys" page from the left menu',
    'quickstart.step2.instruction3': 'Click "Create API Key", enter a name, and copy the key',
    'quickstart.step2.warning': 'Important Warning',
    'quickstart.step2.warningText': 'Copy and store your API key securely. You will not be able to view this key again after closing this window.',
    
    'quickstart.step3.title': 'Make Your First Request',
    'quickstart.step3.description': 'Test the API by sending your first request',
    'quickstart.step3.time': '2 minutes',
    'quickstart.step3.chooseMethod': 'Choose your preferred method',
    'quickstart.step3.methodDescription': 'Select the programming language or tool you are comfortable with',
    'quickstart.step3.expectedResponse': 'Expected Response',
    
    'quickstart.preview.title': 'What You\'ll Build',
    'quickstart.preview.description': 'This is the code you\'ll have after completing the 3 steps',
    'quickstart.preview.followSteps': 'Follow the 3 steps below to start using TTI API',
    
    'quickstart.nextSteps.title': 'Next Steps',
    'quickstart.nextSteps.description': 'You are all set! Explore more features',
    'quickstart.nextSteps.docs': 'Read Documentation',
    'quickstart.nextSteps.docsDescription': 'Learn more about API endpoints and available options',
    'quickstart.nextSteps.playground': 'Try Playground',
    'quickstart.nextSteps.playgroundDescription': 'Test the API interactively without writing code',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.refresh': 'Refresh',
    'common.copied': 'Copied',
    'common.add': 'Add',
    'common.readOnly': 'Read Only',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage project settings and security',
    'settings.tabs.project': 'Project',
    'settings.tabs.security': 'Security',
    'settings.tabs.limits': 'Limits',
    'settings.tabs.webhooks': 'Webhooks',
    'settings.tabs.notifications': 'Notifications',
    
    // Project Settings
    'settings.project.title': 'Project Settings',
    'settings.project.description': 'Manage basic project information',
    'settings.project.name': 'Project Name',
    'settings.project.nameHelp': 'Name displayed in Dashboard and reports',
    'settings.project.environment': 'Environment',
    'settings.project.environmentHelp': 'Cannot be changed after project creation',
    'settings.project.language': 'Default Language',
    'settings.project.languageHelp': 'Language used in Dashboard',
    'settings.project.timezone': 'Timezone',
    'settings.project.timezoneHelp': 'Timezone for displaying dates and times',
    
    // Security Settings
    'settings.security.ipWhitelist': 'IP Whitelist',
    'settings.security.ipWhitelistDesc': 'Restrict API access to specified IP addresses only',
    'settings.security.addIp': 'Add IP Address',
    'settings.security.ipFormat': 'Format: 192.168.1.1',
    'settings.security.allowedIps': 'Allowed IPs',
    'settings.security.noIps': 'No IPs in whitelist',
    'settings.security.apiKeyVisibility': 'API Key Visibility',
    'settings.security.apiKeyVisibilityDesc': 'Control how API keys are displayed in Dashboard',
    'settings.security.showFullKey': 'Show Full',
    'settings.security.showFullKeyDesc': 'Display complete API key',
    'settings.security.maskKey': 'Mask Partial',
    'settings.security.maskKeyDesc': 'Show only first and last characters',
    
    // Rate Limits
    'settings.limits.title': 'Rate Limits & Quotas',
    'settings.limits.description': 'Monitor current usage and limits',
    'settings.limits.requestsPerMinute': 'Requests per Minute',
    'settings.limits.requestsPerMinuteDesc': 'Maximum requests per minute',
    'settings.limits.requestsPerDay': 'Requests per Day',
    'settings.limits.requestsPerDayDesc': 'Maximum requests per day',
    'settings.limits.monthlyQuota': 'Monthly Quota',
    'settings.limits.monthlyQuotaDesc': 'Requests available this month',
    'settings.limits.upgradeNote': 'Need higher limits? Contact sales',
    
    // Webhooks
    'settings.webhooks.title': 'Webhooks',
    'settings.webhooks.description': 'Receive real-time notifications for important events',
    'settings.webhooks.endpointUrl': 'Endpoint URL',
    'settings.webhooks.events': 'Events to Subscribe',
    'settings.webhooks.addWebhook': 'Add Webhook',
    'settings.webhooks.configured': 'Configured Webhooks',
    'settings.webhooks.eventsSelected': 'events',
    
    // Notifications
    'settings.notifications.title': 'Notifications',
    'settings.notifications.description': 'Manage how you receive notifications',
    'settings.notifications.email': 'Email',
    'settings.notifications.emailDesc': 'Receive notifications via email',
    'settings.notifications.inApp': 'In-App',
    'settings.notifications.inAppDesc': 'Show notifications in Dashboard',
    'settings.notifications.types': 'Notification Types',
    'settings.notifications.quotaAlerts': 'Quota Alerts',
    'settings.notifications.quotaAlertsDesc': 'When approaching or exceeding quota',
    'settings.notifications.securityAlerts': 'Security Alerts',
    'settings.notifications.securityAlertsDesc': 'Unusual access or usage patterns',
    'settings.notifications.usageReports': 'Usage Reports',
    'settings.notifications.usageReportsDesc': 'Weekly and monthly summaries',
    
    // Empty States
    'empty.noData': 'No Data',
    'empty.noDataDesc': 'No data available for this time range',
    'empty.noKeys': 'No API Keys',
    'empty.noKeysDesc': 'Create your first API key to start using the TTI API',
    'empty.noUsage': 'No Usage',
    'empty.noUsageDesc': 'Start sending requests to see usage statistics',
    'empty.quotaExceeded': 'Quota Exceeded',
    'empty.quotaExceededDesc': 'You have reached your quota limit. Please wait for reset or contact sales',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'th' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

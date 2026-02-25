import { PrismaClient } from '@prisma/client';
import { 
  users, 
  investmentPlans, 
  systemSettings, 
  systemAlerts, 
  countries
} from './data';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from '@/app/lib/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
   for (const country of countries) {
    await prisma.countries.create({
      data: country,
    });
  }
  

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password_hash, 10);
  
      
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password_hash: hashedPassword,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          country_id: user.country_id,
          is_email_verified: user.is_email_verified,
          email_verified_at: user.email_verified_at,
          referral_code:  user.referral_code,
          referred_by: user.referred_by,
          is_active: user.is_active,
        },
      });



    }




  // Create user profiles
  // for (const profile of userProfiles) {
  //   await prisma.userProfile.create({
  //     data: profile,
  //   });
  // }
  
  // // Create user security
  // for (const security of userSecurities) {
  //   await prisma.userSecurity.create({
  //     data: security,
  //   });
  // }
  
  // // Create user security
  // for (const paymentAccount of paymentAccounts) {
  //   await prisma.paymentAccount.create({
  //     data: paymentAccount,
  //   });
  // }
  
  // Create wallets
  // for (const wallet of wallets) {
  //   await prisma.wallet.create({
  //     data: wallet,
  //   });
  // }
  
  // Create investment plans
  for (const plan of investmentPlans) {
    await prisma.investmentPlan.create({
      data: plan,
    });
  }
  
  // Create transactions
  // for (const transaction of transactions) {
  //   await prisma.transaction.create({
  //     data: transaction,
  //   });
  // }
  
  // // Create investments
  // for (const investment of investments) {
  //   await prisma.investment.create({
  //     data: investment,
  //   });
  // }
  
  // // Create investment profits
  // for (const profit of investmentProfits) {
  //   await prisma.investmentProfit.create({
  //     data: profit,
  //   });
  // }
  
  // Create KYC verifications
  // for (const kyc of kycVerifications) {
  //   await prisma.kycVerification.create({
  //     data: kyc,
  //   });
  // }
  
  // Create referrals
  // for (const referral of referrals) {
  //   await prisma.referral.create({
  //     data: referral,
  //   });
  // }
  
  // Create referral bonuses
  // for (const bonus of referralBonuses) {
  //   await prisma.referralBonus.create({
  //     data: bonus,
  //   });
  // }
  
  // Create withdrawals
  // for (const withdrawal of withdrawals) {
  //   await prisma.withdrawal.create({
  //     data: withdrawal,
  //   });
  // }
  
  // Create notifications
  // for (const notification of notifications) {
  //   await prisma.notification.create({
  //     data: notification,
  //   });
  // }
  
  // Create system settings
  for (const setting of systemSettings) {
    await prisma.systemSetting.create({
      data: setting,
    });
  }
  
  // Create system alerts
  for (const alert of systemAlerts) {
    await prisma.systemAlert.create({
      data: alert,
    });
  }
  
  // Create admin activities
  // for (const activity of adminActivities) {
  //   await prisma.adminActivity.create({
  //     data: activity,
  //   });
  // }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
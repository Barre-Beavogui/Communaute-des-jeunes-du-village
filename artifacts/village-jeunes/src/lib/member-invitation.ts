export function buildMemberInvitation({
  memberName,
  code,
  email,
  phone,
}: {
  memberName: string;
  code: string;
  email?: string | null;
  phone?: string | null;
}) {
  const activationUrl = `https://zoboroma.online/connexion-membre?code=${encodeURIComponent(code)}`;
  const subject = "Votre accès à la communauté Zoboroma";
  const message = `Bonjour ${memberName},

Votre inscription à la communauté des jeunes de Zoboroma a été approuvée.

Votre code de première connexion est : ${code}

Cliquez sur ce lien pour activer votre compte et créer votre mot de passe :
${activationUrl}

Après l’activation, vous pourrez vous connecter avec l’adresse email ou le numéro de téléphone fourni lors de votre inscription, ainsi que votre nouveau mot de passe.

Ce code est personnel. Ne le partagez avec personne.

L’équipe Zoboroma`;
  const emailAddress = email?.trim() ?? "";
  const phoneDigits = (phone ?? "").replace(/[^0-9]/g, "").replace(/^00/, "");

  return {
    subject,
    message,
    activationUrl,
    emailHref: emailAddress
      ? `mailto:${encodeURIComponent(emailAddress)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
      : null,
    whatsappHref: phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`
      : null,
  };
}

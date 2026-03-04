# AutoCount Debtor Table Columns (AED_EPICO, v2.2.49)

Discovered 2026-03-04 via `SELECT * FROM Debtor` (82 columns, 401 rows).

## Column List

| Column                    | Used in Sync       | Maps to                     |
| ------------------------- | ------------------ | --------------------------- |
| AutoKey                   |                    |                             |
| AccNo                     | Yes                | `autocount_debtor_code`     |
| CompanyName               | Yes                | `name`, `company_name`      |
| Desc2                     |                    |                             |
| RegisterNo                | Yes (fallback UEN) | `uen`                       |
| Address1                  | Yes                | `address` (combined)        |
| Address2                  | Yes                | `address` (combined)        |
| Address3                  | Yes                | `address` (combined)        |
| Address4                  | Yes                | `address` (combined)        |
| PostCode                  |                    |                             |
| DeliverAddr1              |                    |                             |
| DeliverAddr2              |                    |                             |
| DeliverAddr3              |                    |                             |
| DeliverAddr4              |                    |                             |
| DeliverPostCode           |                    |                             |
| Attention                 |                    |                             |
| Phone1                    | Yes                | `phone`                     |
| Phone2                    | Yes (fallback)     | `phone`                     |
| Fax1                      |                    |                             |
| Fax2                      |                    |                             |
| AreaCode                  |                    |                             |
| SalesAgent                |                    |                             |
| DebtorType                |                    |                             |
| NatureOfBusiness          |                    |                             |
| WebURL                    |                    |                             |
| EmailAddress              | Yes                | `email`                     |
| DisplayTerm               |                    |                             |
| CreditLimit               | Yes                | `credit_limit`              |
| AgingOn                   |                    |                             |
| StatementType             |                    |                             |
| CurrencyCode              |                    |                             |
| AllowExceedCreditLimit    |                    |                             |
| Note                      |                    |                             |
| ExemptNo                  |                    |                             |
| ExpiryDate                |                    |                             |
| PriceCategory             |                    |                             |
| TaxType                   |                    |                             |
| DiscountPercent           |                    |                             |
| DetailDiscount            |                    |                             |
| LastModified              |                    | Future: incremental sync    |
| LastModifiedUserID        |                    |                             |
| CreatedTimeStamp          |                    |                             |
| CreatedUserID             |                    |                             |
| OverdueLimit              |                    |                             |
| HasBonusPoint             |                    |                             |
| OpeningBonusPoint         |                    |                             |
| QTBlockStatus             |                    |                             |
| SOBlockStatus             |                    |                             |
| DOBlockStatus             |                    |                             |
| IVBlockStatus             |                    |                             |
| CSBlockStatus             |                    |                             |
| QTBlockMessage            |                    |                             |
| SOBlockMessage            |                    |                             |
| DOBlockMessage            |                    |                             |
| IVBlockMessage            |                    |                             |
| CSBlockMessage            |                    |                             |
| ExternalLink              |                    |                             |
| IsGroupCompany            |                    |                             |
| IsActive                  | Yes                | `status` (active/suspended) |
| LastUpdate                |                    |                             |
| ContactInfo               |                    |                             |
| AccountGroup              |                    |                             |
| MarkupRatio               |                    |                             |
| TaxRegisterNo             |                    |                             |
| CalcDiscountOnUnitPrice   |                    |                             |
| GSTStatusVerifiedDate     |                    |                             |
| InclusiveTax              |                    |                             |
| RoundingMethod            |                    |                             |
| SelfBilledApprovalNo      |                    |                             |
| Guid                      |                    |                             |
| IsTaxRegistered           |                    |                             |
| ReceiptWithholdingTaxCode |                    |                             |
| PaymentWithholdingTaxCode |                    |                             |
| MultiPrice                |                    |                             |
| AllowChangeMultiPrice     |                    |                             |
| TaxBranchID               |                    |                             |
| ServiceTaxRegisterNo      |                    |                             |
| Mobile                    |                    |                             |
| CGBlockStatus             |                    |                             |
| CGBlockMessage            |                    |                             |
| UDF_Latitude              |                    |                             |
| UDF_Longitude             |                    |                             |

## Notes

- `RegisterNo` is the business registration number (equivalent to UEN in Singapore context)
- `DisplayTerm` appears to be the credit term display string (not `CreditTerm`)
- `DebtorType` (not `DebtorTypeCode`) is the debtor classification
- `Fax1`/`Fax2` (not `FaxNo`), `Attention` (not `Contact`)
- `UDF_Latitude`/`UDF_Longitude` are user-defined fields (custom)
- `LastModified` available for future incremental sync
